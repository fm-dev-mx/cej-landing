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

    it('redirects unauthenticated users from /dashboard to /login', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

        const req = new NextRequest('http://localhost/dashboard/orders');
        const res = await proxy(req);

        expect(res?.status).toBe(307);
        expect(res?.headers.get('location')).toContain('/login?redirect=%2Fdashboard%2Forders');
    });

    it('allows access to /dashboard for authenticated users', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });

        const req = new NextRequest('http://localhost/dashboard');
        const res = await proxy(req);

        // Should return a 200/NextResponse.next() equivalent (not a redirect)
        expect(res?.status).toBe(200);
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
