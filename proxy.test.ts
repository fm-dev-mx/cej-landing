/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import proxy from './proxy';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseConfig } from '@/config/env';

vi.mock('@supabase/ssr', () => ({
    createServerClient: vi.fn(),
}));

vi.mock('@/config/env', () => ({
    getSupabaseConfig: vi.fn(),
}));

describe('Proxy Middleware', () => {
    const mockGetUser = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getSupabaseConfig).mockReturnValue({
            url: 'https://test.supabase.co',
            anonKey: 'test-key',
            isConfigured: true,
        });
        vi.mocked(createServerClient).mockReturnValue({
            auth: { getUser: mockGetUser },
            cookies: {
                getAll: vi.fn().mockReturnValue([]),
                setAll: vi.fn(),
            },
        } as any);
    });

    it('redirects unauthenticated users from /dashboard to /login with security headers', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

        const req = new NextRequest('http://localhost/dashboard/orders');
        const res = await proxy(req);

        expect(res?.status).toBe(307);
        expect(res?.headers.get('location')).toContain('/login?redirect=%2Fdashboard%2Forders');

        // Assert security headers are present on redirects
        expect(res?.headers.get('X-Frame-Options')).toBe('DENY');
        expect(res?.headers.get('X-Content-Type-Options')).toBe('nosniff');
        expect(res?.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    it('returns 404 with security headers for non-allowlisted routes', async () => {
        const req = new NextRequest('http://localhost/unknown-route');
        const res = await proxy(req);

        expect(res?.status).toBe(404);

        // Assert security headers are present on 404s
        expect(res?.headers.get('X-Frame-Options')).toBe('DENY');
        expect(res?.headers.get('X-Content-Type-Options')).toBe('nosniff');
        expect(res?.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    it('allows access to /dashboard for authenticated users', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });

        const req = new NextRequest('http://localhost/dashboard');
        const res = await proxy(req);

        // Should return a 200/NextResponse.next() equivalent (not a redirect)
        expect(res?.status).toBe(200);

        // Security headers for normal responses should NOT be in the proxy response
        // as they are handled by next.config.ts
        expect(res?.headers.get('X-Frame-Options')).toBeNull();
    });

    it('passes through if Supabase is not configured', async () => {
        vi.mocked(getSupabaseConfig).mockReturnValue({
            url: '',
            anonKey: '',
            isConfigured: false,
        });

        const req = new NextRequest('http://localhost/dashboard');
        const res = await proxy(req);

        expect(res?.status).toBe(200);
    });
});
