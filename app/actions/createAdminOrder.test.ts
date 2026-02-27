/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAdminOrder, type AdminOrderPayload } from './createAdminOrder';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
    generateQuoteId: vi.fn(() => 'ADMIN-123'),
}));

describe('createAdminOrder', () => {
    const mockInsert = vi.fn();
    const mockSelect = vi.fn();
    const mockSingle = vi.fn();

    const validPayload: AdminOrderPayload = {
        name: 'Test Client',
        phone: '1234567890',
        volume: 5,
        concreteType: 'direct',
        strength: '250',
        deliveryAddress: 'Test Address 123',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(createClient).mockResolvedValue({
            auth: { getUser: () => Promise.resolve({ data: { user: { id: 'admin-id' } } }) },
            from: () => ({
                insert: mockInsert.mockReturnValue({
                    select: mockSelect.mockReturnValue({
                        single: mockSingle
                    })
                })
            })
        } as unknown as any);
    });

    it('inserts a new lead row with admin_dashboard UTM source', async () => {
        mockSingle.mockResolvedValue({ data: { id: '999' }, error: null });

        const result = await createAdminOrder(validPayload);

        expect(result.status).toBe('success');
        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
            utm_source: 'admin_dashboard',
            utm_medium: 'internal',
            name: 'Test Client',
        }));
    });

    it('returns error result on DB failure', async () => {
        mockSingle.mockResolvedValue({ data: null, error: { message: 'DB Error', code: '500' } });

        const result = await createAdminOrder(validPayload);

        expect(result.status).toBe('error');
        if (result.status === 'error') {
            expect(result.message).toContain('No se pudo registrar');
        }
    });

    it('redirects to /login if user is not authenticated', async () => {
        vi.mocked(createClient).mockResolvedValueOnce({
            auth: { getUser: () => Promise.resolve({ data: { user: null } }) }
        } as unknown as any);

        await expect(createAdminOrder(validPayload)).rejects.toThrow('NEXT_REDIRECT');
    });
});
