/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAdminOrder, type AdminOrderPayload } from './createAdminOrder';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
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
            from: () => ({
                insert: mockInsert.mockReturnValue({
                    select: mockSelect.mockReturnValue({
                        single: mockSingle,
                    }),
                }),
            }),
        } as unknown as any);
    });

    it('inserts a new order row compatible with dashboard list shape', async () => {
        mockSingle.mockResolvedValue({ data: { id: '999' }, error: null });

        const result = await createAdminOrder(validPayload);

        expect(result.status).toBe('success');
        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
            user_id: 'admin-id',
            folio: 'ADMIN-123',
            status: 'draft',
            order_status: 'draft',
            payment_status: 'pending',
            fiscal_status: 'not_requested',
            total_amount: 1160,
            currency: 'MXN',
            delivery_address: 'Test Address 123',
            delivery_address_text: 'Test Address 123',
            balance_amount: 1160,
            items: expect.arrayContaining([
                expect.objectContaining({
                    label: "Concreto Directo f'c 250",
                    volume: 5,
                    service: 'direct',
                    subtotal: 1000,
                }),
            ]),
            pricing_version: 1,
            price_breakdown: expect.any(Object),
        }));
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
