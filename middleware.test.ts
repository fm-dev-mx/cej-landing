/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { middleware } from './middleware';
import { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

vi.mock('@/lib/supabase/middleware', () => ({
    createMiddlewareClient: vi.fn(),
}));

describe('Global Middleware', () => {
    const mockGetUser = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(createMiddlewareClient).mockReturnValue({
            auth: { getUser: mockGetUser },
        } as unknown as any);
    });

    it('redirects unauthenticated users from /dashboard to /login', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

        const req = new NextRequest('http://localhost/dashboard/orders');
        const res = await middleware(req);

        expect(res?.status).toBe(307);
        expect(res?.headers.get('location')).toContain('/login?redirectTo=%2Fdashboard%2Forders');
    });

    it('allows access to /dashboard for authenticated users', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });

        const req = new NextRequest('http://localhost/dashboard');
        const res = await middleware(req);

        // Should return a 200/NextResponse.next() equivalent (not a redirect)
        expect(res?.status).toBe(200);
    });

    it('passes through if Supabase is not configured', async () => {
        vi.mocked(createMiddlewareClient).mockReturnValue(null as unknown as any);

        const req = new NextRequest('http://localhost/dashboard');
        const res = await middleware(req);

        expect(res?.status).toBe(200);
    });

    it('refreshes user session on every request (non-static)', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

        const req = new NextRequest('http://localhost/some-page');
        await middleware(req);

        expect(mockGetUser).toHaveBeenCalled();
    });
});
