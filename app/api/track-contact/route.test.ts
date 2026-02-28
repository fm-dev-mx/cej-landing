// app/api/track-contact/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { cookies, headers } from 'next/headers';
import { sendToMetaCAPI } from '@/lib/tracking/capi';

vi.mock('next/headers', () => ({
    cookies: vi.fn(),
    headers: vi.fn(),
}));

vi.mock('@/lib/tracking/capi', () => ({
    sendToMetaCAPI: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
}));

describe('Track Contact API Route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createMockRequest = (body: Record<string, unknown>) => {
        return new NextRequest('http://localhost/api/track-contact', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    };

    it('returns 400 if event_id is missing', async () => {
        const req = createMockRequest({});
        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Missing event_id');
    });

    it('successfully fires CAPI event with cookies and headers', async () => {
        const mockEventId = 'test-event-123';
        const req = createMockRequest({ event_id: mockEventId });

        // Mock cookies
        const mockCookieStore = {
            get: vi.fn((name) => {
                if (name === '_fbp') return { value: 'fbp-123' };
                if (name === '_fbc') return { value: 'fbc-456' };
                return undefined;
            }),
        };
        vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>);

        // Mock headers
        const mockHeaderStore = {
            get: vi.fn((name) => {
                if (name === 'x-forwarded-for') return '1.2.3.4';
                if (name === 'user-agent') return 'test-agent';
                if (name === 'referer') return 'http://test.com';
                return undefined;
            }),
        };
        vi.mocked(headers).mockResolvedValue(mockHeaderStore as unknown as Awaited<ReturnType<typeof headers>>);

        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ ok: true });

        expect(sendToMetaCAPI).toHaveBeenCalledWith(expect.objectContaining({
            event_name: 'Contact',
            event_id: mockEventId,
            user_data: expect.objectContaining({
                client_ip_address: '1.2.3.4',
                client_user_agent: 'test-agent',
                fbp: 'fbp-123',
                fbc: 'fbc-456',
            }),
        }));
    });

    it('gracefully handles missing attribution cookies', async () => {
        const req = createMockRequest({ event_id: 'test-id' });

        vi.mocked(cookies).mockResolvedValue({ get: vi.fn() } as unknown as Awaited<ReturnType<typeof cookies>>);
        vi.mocked(headers).mockResolvedValue({ get: vi.fn() } as unknown as Awaited<ReturnType<typeof headers>>);

        const res = await POST(req);
        expect(res.status).toBe(200);

        expect(sendToMetaCAPI).toHaveBeenCalledWith(expect.objectContaining({
            user_data: expect.objectContaining({
                client_ip_address: '0.0.0.0',
                fbp: undefined,
                fbc: undefined,
            }),
        }));
    });
});
