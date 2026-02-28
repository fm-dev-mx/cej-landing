// File: lib/tracking/capi.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendToMetaCAPI } from './capi';
import { reportError } from '@/lib/monitoring';
import * as dlqModule from './capi-deadletters.server';

// Mock env
vi.mock('@/config/env', () => ({
    env: {
        FB_ACCESS_TOKEN: 'mock-token',
        NEXT_PUBLIC_PIXEL_ID: '1234567890',
        META_TEST_EVENT_CODE: undefined
    }
}));

// Mock monitoring
vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
}));

// Mock DLQ at top level (hoisted)
vi.mock('./capi-deadletters.server', () => ({
    insertDeadLetter: vi.fn().mockResolvedValue(undefined),
}));

const mockPayload = {
    event_name: 'Lead',
    event_time: 1700000000,
    event_id: 'uuid-1234',
    event_source_url: 'http://localhost',
    action_source: 'website' as const,
    user_data: {
        client_ip_address: '127.0.0.1',
        client_user_agent: 'Mozilla/Test',
        em: 'hashed_email_string',
        ph: 'hashed_phone_string'
    }
};

describe('Meta CAPI Service Hardening', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = vi.fn();
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('sends correct payload structure to Meta', async () => {
        (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, result: "ok" })
        });

        await sendToMetaCAPI(mockPayload);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, options] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];

        expect(url).toContain('1234567890'); // Checks PIXEL_ID in URL
        const body = JSON.parse(options.body);

        expect(body.access_token).toBe('mock-token');
        expect(body.data[0].event_name).toBe('Lead');
        expect(body.data[0].user_data.em).toBe('hashed_email_string');
    });

    it('includes test_event_code when META_TEST_EVENT_CODE env is set', async () => {
        const { env } = await import('@/config/env');
        vi.mocked(env).META_TEST_EVENT_CODE = 'TEST12345';

        (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true })
        });

        await sendToMetaCAPI(mockPayload);

        const [, options] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
        const body = JSON.parse(options.body);
        expect(body.test_event_code).toBe('TEST12345');

        // Reset for other tests
        vi.mocked(env).META_TEST_EVENT_CODE = undefined;
    });

    it('omits test_event_code when META_TEST_EVENT_CODE env is not set', async () => {
        (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, error: null })
        });

        await sendToMetaCAPI(mockPayload);

        const [, options] = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
        const body = JSON.parse(options.body);
        expect(body.test_event_code).toBeUndefined();
    });

    it('handles fetch network error gracefully (catch branch)', async () => {
        (global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

        await sendToMetaCAPI(mockPayload);

        expect(reportError).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({ source: 'MetaCAPI' })
        );
    });

    it('retries on 5xx errors and eventually succeeds', async () => {
        const fetchMock = vi.mocked(global.fetch);
        fetchMock
            .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: 'Fail' }) } as Response)
            .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({ error: 'Service Unavailable' }) } as Response)
            .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) } as Response);

        await sendToMetaCAPI(mockPayload);

        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(reportError).not.toHaveBeenCalled();
    });

    it('short-circuits and does not retry on 4xx errors', async () => {
        const fetchMock = vi.mocked(global.fetch);
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ error: { message: 'Bad Request' } })
        } as Response);

        await sendToMetaCAPI(mockPayload);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(reportError).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({ attempts: 1 })
        );
    });

    it('sends to DLQ after exhausting all 3 retries (total 4 attempts)', async () => {
        const fetchMock = vi.mocked(global.fetch);
        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Fatal' })
        } as Response);

        await sendToMetaCAPI(mockPayload);

        expect(fetchMock).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
        expect(reportError).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({ attempts: 4 })
        );
        expect(dlqModule.insertDeadLetter).toHaveBeenCalledWith(
            mockPayload,
            expect.stringContaining('Fatal')
        );
    });

    it('retries on timeout (AbortError)', async () => {
        vi.useFakeTimers();
        const fetchMock = vi.mocked(global.fetch);

        // Mock fetch to simulate a timeout by resolving only when signal is aborted
        fetchMock.mockImplementation((_url, options) => {
            return new Promise((_resolve, reject) => {
                options?.signal?.addEventListener('abort', () => {
                    reject(new (class AbortError extends Error { name = 'AbortError'; })());
                });
            });
        });

        const promise = sendToMetaCAPI(mockPayload);

        // We expect 4 attempts (0, 1, 2, 3)
        // Each attempt has 4s timeout + backoff
        for (let i = 0; i < 4; i++) {
            await vi.advanceTimersByTimeAsync(4001); // Trigger Timeout
            await vi.advanceTimersByTimeAsync(2000); // Trigger backoff delay
        }

        await promise;

        expect(fetchMock).toHaveBeenCalledTimes(4);
        expect(dlqModule.insertDeadLetter).toHaveBeenCalled();

        vi.useRealTimers();
    });

    it('skips execution if token is missing', async () => {
        const { env } = await import('@/config/env');
        const originalToken = env.FB_ACCESS_TOKEN;
        vi.mocked(env).FB_ACCESS_TOKEN = undefined;

        await sendToMetaCAPI(mockPayload);

        expect(global.fetch).not.toHaveBeenCalled();

        vi.mocked(env).FB_ACCESS_TOKEN = originalToken;
    });
});
