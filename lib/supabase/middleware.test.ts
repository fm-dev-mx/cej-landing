/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { createMiddlewareClient } from './middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

vi.mock('@supabase/ssr', () => ({
    createServerClient: vi.fn(),
}));

vi.mock('@/config/env', () => ({
    getSupabaseConfig: vi.fn(() => ({
        url: 'https://test.supabase.co',
        anonKey: 'test-key',
        isConfigured: true,
    })),
}));

describe('createMiddlewareClient', () => {
    it('returns null if Supabase is not configured', async () => {
        const { getSupabaseConfig } = await import('@/config/env');
        vi.mocked(getSupabaseConfig).mockReturnValueOnce({ isConfigured: false } as unknown as any);

        const req = new NextRequest('http://localhost');
        const res = NextResponse.next();
        const client = createMiddlewareClient(req, res);

        expect(client).toBeNull();
    });

    it('creates a client with correct cookie handlers', () => {
        const req = new NextRequest('http://localhost');
        req.cookies.set('test-cookie', 'test-value');
        const res = NextResponse.next();

        createMiddlewareClient(req, res);

        expect(createServerClient).toHaveBeenCalledWith(
            'https://test.supabase.co',
            'test-key',
            expect.objectContaining({
                cookies: expect.any(Object),
            })
        );

        // Verify cookie methods behavior
        const callArgs = vi.mocked(createServerClient).mock.calls[0][2];
        if (!callArgs || !callArgs.cookies) {
            throw new Error('createServerClient was not called with cookies option');
        }
        const { getAll, setAll } = callArgs.cookies;

        // getAll
        if (getAll) {
            expect(getAll()).toContainEqual(expect.objectContaining({ name: 'test-cookie', value: 'test-value' }));
        }

        // setAll
        if (setAll) {
            setAll([{ name: 'new-cookie', value: 'new-value', options: {} }]);
            expect(req.cookies.get('new-cookie')?.value).toBe('new-value');
            expect(res.cookies.get('new-cookie')?.value).toBe('new-value');
        }
    });
});
