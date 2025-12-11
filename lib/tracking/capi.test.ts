// File: lib/tracking/capi.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendToMetaCAPI } from './capi';
import { reportError } from '@/lib/monitoring';

// Mock env
vi.mock('@/config/env', () => ({
    env: {
        FB_ACCESS_TOKEN: 'mock-token',
        NEXT_PUBLIC_PIXEL_ID: '1234567890'
    }
}));

// Mock monitoring
vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
}));

// Mock global fetch
const globalFetch = global.fetch;

describe('Meta CAPI Service', () => {
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

    beforeEach(() => {
        global.fetch = vi.fn();
        vi.clearAllMocks();
    });

    afterEach(() => {
        global.fetch = globalFetch;
    });

    it('sends correct payload structure to Meta', async () => {
        (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true })
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

    it('handles API errors gracefully (Fail-Open)', async () => {
        // Simular error de Meta (400 Bad Request)
        (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            json: async () => ({ error: { message: 'Invalid parameter' } })
        });

        await sendToMetaCAPI(mockPayload);

        // No debe lanzar excepción, pero debe reportar el error
        expect(reportError).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({ source: 'MetaCAPI' })
        );
    });

    it('skips execution if token is missing (Dev Mode)', async () => {
        vi.resetModules();
        vi.doMock('@/config/env', () => ({
            env: { FB_ACCESS_TOKEN: undefined } // Simulate missing token
        }));

        // Re-import module to apply new mock
        const { sendToMetaCAPI: sendToMetaCAPI_NoToken } = await import('./capi');

        await sendToMetaCAPI_NoToken(mockPayload);

        expect(global.fetch).not.toHaveBeenCalled();
    });
});
