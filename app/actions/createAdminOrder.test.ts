/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAdminOrder, type AdminOrderPayload } from './createAdminOrder';
import { createAdminClient, createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
    createAdminClient: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
}));

vi.mock('next/headers', () => ({
    headers: () => Promise.resolve({
        get: (k: string) => k === 'x-forwarded-for' ? '127.0.0.1' : (k === 'user-agent' ? 'Mozilla/5.0' : null)
    }),
    cookies: () => Promise.resolve({ get: (k: string) => k === 'cej_utm' ? { value: JSON.stringify({ source: 'fb' }) } : null })
}));

vi.mock('@/lib/utils', () => ({
    generateQuoteId: vi.fn(() => 'ADMIN-123'),
}));

vi.mock('./getPriceConfig', () => ({
    getPriceConfig: vi.fn(() => Promise.resolve({ version: 1, base: {}, additives: [], vatRate: 0.16, minOrderQuantity: {} })),
}));

vi.mock('@/lib/pricing', () => ({
    calcQuote: vi.fn(() => ({
        total: 1160,
        baseSubtotal: 1000,
        pricingSnapshot: { rules_version: 1 }
    })),
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
            auth: {
                getUser: () => Promise.resolve({ data: { user: { id: 'admin-id', user_metadata: { role: 'admin' } } } }),
            },
        } as unknown as any);

        vi.mocked(createAdminClient).mockResolvedValue({
            from: () => ({
                insert: mockInsert.mockReturnValue({
                    select: mockSelect.mockReturnValue({
                        single: mockSingle,
                    }),
                }),
            }),
        } as unknown as any);
    });

    it('inserts a new order row using the canonical schema', async () => {
        mockSingle.mockResolvedValue({ data: { id: '999' }, error: null });

        const result = await createAdminOrder(validPayload);

        expect(result.status).toBe('success');
        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
            user_id: 'admin-id',
            folio: 'ADMIN-123',
            order_status: 'draft',
            payment_status: 'pending',
            fiscal_status: 'not_requested',
            total_with_vat: 1160,
            delivery_address_text: 'Test Address 123',
            service_type: 'tirado',
            quantity_m3: 5,
            pricing_snapshot_json: expect.any(Object),
        }));

        // Negative check: should NOT contain legacy fields
        const capturedPayload = mockInsert.mock.calls[0][0];
        expect(capturedPayload.status).toBeUndefined();
        expect(capturedPayload.items).toBeUndefined();
        expect(capturedPayload.total_amount).toBeUndefined();
    });

    it('returns error result on validation failure', async () => {
        const invalidPayload = { ...validPayload, name: '' };
        const result = await createAdminOrder(invalidPayload);

        expect(result.status).toBe('error');
        if (result.status === 'error') {
            expect(result.message).toContain('Revisa los datos');
        }
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
            auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
        } as unknown as any);

        await expect(createAdminOrder(validPayload)).rejects.toThrow('NEXT_REDIRECT');
    });
});
