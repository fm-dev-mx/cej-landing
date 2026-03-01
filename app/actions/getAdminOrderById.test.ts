/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdminOrderById } from './getAdminOrderById';
import { createAdminClient, createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
    createAdminClient: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
}));

describe('getAdminOrderById', () => {
    let mockFrom: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockFrom = vi.fn((table: string) => {
            const chain: any = {};
            chain.select = vi.fn().mockReturnValue(chain);
            chain.eq = vi.fn().mockReturnValue(chain);
            chain.order = vi.fn().mockReturnValue(chain);
            chain.in = vi.fn().mockReturnValue(chain);
            chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
            chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
            chain.then = (cb: (value: unknown) => unknown) =>
                Promise.resolve({ data: [], error: null }).then(cb);

            if (table === 'orders') {
                chain.single = vi.fn().mockResolvedValue({
                    data: { id: 'd0fc878d-ea81-424a-9da8-e9f02377b63f', user_id: 'user123', scheduled_slot_code: 'morning' },
                    error: null
                });
            } else if (table === 'order_payments') {
                chain.then = (cb: (value: unknown) => unknown) =>
                    Promise.resolve({ data: [{ id: 'payment1', amount_mxn: 500 }], error: null }).then(cb);
            } else if (table === 'order_status_history') {
                chain.then = (cb: (value: unknown) => unknown) =>
                    Promise.resolve({ data: [{ id: 'history1' }], error: null }).then(cb);
            } else if (table === 'order_fiscal_data') {
                chain.maybeSingle = vi.fn().mockResolvedValue({ data: { requires_invoice: true, rfc: 'TEST010203000' }, error: null });
            } else if (table === 'profiles') {
                chain.in = vi.fn().mockReturnValue({
                    then: (cb: (value: unknown) => unknown) => Promise.resolve({ data: [{ id: 'user123', full_name: 'John' }], error: null }).then(cb)
                });
            } else if (table === 'service_slots') {
                chain.maybeSingle = vi.fn().mockResolvedValue({ data: { slot_code: 'morning' }, error: null });
            }

            return chain;
        });

        vi.mocked(createClient).mockResolvedValue({
            auth: { getUser: () => Promise.resolve({ data: { user: { id: 'admin-id', user_metadata: { role: 'admin' } } } }) },
        } as any);

        vi.mocked(createAdminClient).mockResolvedValue({
            from: mockFrom,
        } as any);
    });

    it('returns error for invalid UUID', async () => {
        const result = await getAdminOrderById('invalid-uuid');
        expect(result.success).toBe(false);
        expect(result.error).toBe('ID de pedido inválido');
    });

    it('returns order details with related data successfully', async () => {
        const result = await getAdminOrderById('d0fc878d-ea81-424a-9da8-e9f02377b63f');
        expect(result.success).toBe(true);
        expect(result.data?.order.id).toBe('d0fc878d-ea81-424a-9da8-e9f02377b63f');
        expect(result.data?.payments.length).toBe(1);
        expect(result.data?.statusHistory.length).toBe(1);
        expect(result.data?.fiscalData?.requires_invoice).toBe(true);
        expect(result.data?.profiles['user123']?.full_name).toBe('John');
        expect(result.data?.serviceSlot?.slot_code).toBe('morning');
    });

    it('returns error if order is not found', async () => {
        mockFrom.mockImplementationOnce((table: string) => {
            const chain: any = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
            chain.single = vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') });
            return chain;
        });

        const result = await getAdminOrderById('d0fc878d-ea81-424a-9da8-e9f02377b63f');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Pedido no encontrado');
    });
});
