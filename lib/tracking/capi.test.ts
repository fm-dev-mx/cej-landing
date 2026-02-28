// File: lib/tracking/capi.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { reportError } from '@/lib/monitoring';

vi.mock('@/lib/monitoring', () => ({ reportError: vi.fn() }));

const DEFAULT_ENV = { FB_ACCESS_TOKEN: 'mock-token', NEXT_PUBLIC_PIXEL_ID: '1234567890', META_TEST_EVENT_CODE: undefined };
const mockPayload = {
    event_name: 'Lead', event_time: 1700000000, event_id: 'uuid-1234',
    event_source_url: 'http://localhost', action_source: 'website' as const,
    user_data: { client_ip_address: '127.0.0.1', client_user_agent: 'M', em: 'h_em', ph: 'h_ph' }
};

async function setupTest() {
    const { sendToMetaCAPI } = await import('./capi');
    const { insertDeadLetter } = await import('./capi-deadletters.server');
    return { sendToMetaCAPI, insertDeadLetter, fetchMock: vi.mocked(global.fetch) };
}

async function setupMetaSuccess() {
    const deps = await setupTest();
    deps.fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) } as Response);
    return deps;
}

describe('Meta CAPI Service Hardening', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        vi.resetModules(); global.fetch = vi.fn();
        vi.clearAllMocks(); vi.useRealTimers();
        vi.doMock('@/config/env', () => ({ env: DEFAULT_ENV }));
        vi.doMock('./capi-deadletters.server', () => ({ insertDeadLetter: vi.fn().mockResolvedValue(undefined) }));
    });

    afterEach(() => { global.fetch = originalFetch; });

    it('sends correct payload structure', async () => {
        const { sendToMetaCAPI, fetchMock } = await setupMetaSuccess();
        await sendToMetaCAPI(mockPayload);
        const [url, opt] = fetchMock.mock.calls[0] ?? [];
        expect(url).toBe('https://graph.facebook.com/v19.0/1234567890/events');
        expect(opt?.method).toBe('POST');
        expect(JSON.parse(opt?.body as string).access_token).toBe('mock-token');
    });

    it('includes test_event_code when env is set', async () => {
        vi.doMock('@/config/env', () => ({ env: { ...DEFAULT_ENV, META_TEST_EVENT_CODE: 'T1' } }));
        const { sendToMetaCAPI, fetchMock } = await setupMetaSuccess();
        await sendToMetaCAPI(mockPayload);
        const body = fetchMock.mock.calls[0]?.[1]?.body;
        expect(JSON.parse(body as string).test_event_code).toBe('T1');
    });

    it('omits test_event_code when env is not set', async () => {
        const { sendToMetaCAPI, fetchMock } = await setupMetaSuccess();
        await sendToMetaCAPI(mockPayload);
        const body = fetchMock.mock.calls[0]?.[1]?.body;
        expect(JSON.parse(body as string).test_event_code).toBeUndefined();
    });

    it('handles network error', async () => {
        vi.useFakeTimers();
        const { sendToMetaCAPI, fetchMock } = await setupTest();
        fetchMock.mockRejectedValue(new Error('Net'));
        const p = sendToMetaCAPI(mockPayload);
        await advanceRetries(3); await p;
        expect(reportError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ source: 'MetaCAPI' }));
        vi.useRealTimers();
    });

    async function advanceRetries(n: number) {
        for (let i = 0; i < n; i++) await vi.advanceTimersByTimeAsync(Math.pow(2, i) * 1001);
    }

    it('retries on 5xx and succeeds', async () => {
        vi.useFakeTimers();
        const { sendToMetaCAPI, fetchMock } = await setupTest();
        fetchMock.mockResolvedValueOnce({ ok: false, status: 500 } as unknown as Response).mockResolvedValueOnce({ ok: false, status: 503 } as unknown as Response).mockResolvedValueOnce({ ok: true } as unknown as Response);
        const p = sendToMetaCAPI(mockPayload);
        await advanceRetries(2); await p;
        expect(fetchMock).toHaveBeenCalledTimes(3);
        vi.useRealTimers();
    });

    it('skips DLQ for 4xx permanent', async () => {
        const { sendToMetaCAPI, insertDeadLetter, fetchMock } = await setupTest();
        fetchMock.mockResolvedValueOnce({ ok: false, status: 400 } as unknown as Response);
        await sendToMetaCAPI(mockPayload);
        expect(insertDeadLetter).not.toHaveBeenCalled();
    });

    it('sends to DLQ on 429', async () => {
        const { sendToMetaCAPI, insertDeadLetter, fetchMock } = await setupTest();
        fetchMock.mockResolvedValue({ ok: false, status: 429 } as unknown as Response);
        await sendToMetaCAPI(mockPayload);
        expect(insertDeadLetter).toHaveBeenCalled();
    });

    it('sends to DLQ after 5xx retries', async () => {
        vi.useFakeTimers();
        const { sendToMetaCAPI, insertDeadLetter, fetchMock } = await setupTest();
        fetchMock.mockResolvedValue({ ok: false, status: 500 } as unknown as Response);
        const p = sendToMetaCAPI(mockPayload);
        await advanceRetries(3); await p;
        expect(fetchMock).toHaveBeenCalledTimes(4);
        expect(insertDeadLetter).toHaveBeenCalled();
        vi.useRealTimers();
    }, 20000);

    it('retries on timeout', async () => {
        vi.useFakeTimers();
        const { sendToMetaCAPI, insertDeadLetter, fetchMock } = await setupTest();
        const abortError = new Error('The operation was aborted.');
        abortError.name = 'AbortError';
        fetchMock.mockImplementation(() => {
            return Promise.reject(abortError);
        });
        const p = sendToMetaCAPI(mockPayload);
        await vi.runAllTimersAsync();
        await p;
        expect(fetchMock).toHaveBeenCalledTimes(4);
        expect(insertDeadLetter).toHaveBeenCalled();
        vi.useRealTimers();
    }, 30000);

    it('skips if no token', async () => {
        vi.doMock('@/config/env', () => ({ env: { ...DEFAULT_ENV, FB_ACCESS_TOKEN: undefined } }));
        const { sendToMetaCAPI, fetchMock } = await setupTest();
        await sendToMetaCAPI(mockPayload);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
