/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase Client
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn(() => ({
    insert: mockInsert,
}));

// Chain select to insert return
mockInsert.mockReturnValue({ select: mockSelect });

// Mock @supabase/supabase-js module
vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        from: mockFrom,
    })),
}));

describe('API Route: POST /api/leads', () => {
    // Save original env
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules(); // IMPORTANT: Resets module cache so route.ts is re-evaluated
        vi.clearAllMocks();

        // Configure environment variables BEFORE importing the route
        process.env = {
            ...originalEnv,
            NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
            SUPABASE_SERVICE_ROLE_KEY: 'test-key',
        };

        // Default successful behavior
        mockSelect.mockResolvedValue({ data: [{ id: 1 }], error: null });
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    // Helper to create Requests
    const createRequest = (body: any) => {
        return new Request('http://localhost/api/leads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    };

    it('returns 400 if required fields are missing', async () => {
        const { POST } = await import('./route');

        const req = createRequest({ name: 'Just Name' }); // Missing phone and quote
        const res = await POST(req);

        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toMatch(/Missing required fields/i);
    });

    it('successfully saves a lead to Supabase', async () => {
        const { POST } = await import('./route');

        const payload = {
            name: 'Test User',
            phone: '1234567890',
            quote: { total: 1000 }
        };

        const req = createRequest(payload);
        const res = await POST(req);

        // Verify Supabase call
        expect(mockFrom).toHaveBeenCalledWith('leads');
        expect(mockInsert).toHaveBeenCalledWith([
            expect.objectContaining({
                name: 'Test User',
                phone: '1234567890',
                quote_data: { total: 1000 },
                status: 'new'
            })
        ]);

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.success).toBe(true);
    });

    it('returns 500 if Supabase fails', async () => {
        const { POST } = await import('./route');

        // Simulate Supabase error
        mockSelect.mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
        });

        // Silence console.error for this test case to keep output clean
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const payload = {
            name: 'Test User',
            phone: '1234567890',
            quote: {}
        };

        const req = createRequest(payload);
        const res = await POST(req);

        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.error).toBe('Internal Server Error');

        consoleSpy.mockRestore();
    });
});
