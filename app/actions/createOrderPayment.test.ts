/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createOrderPayment } from './createOrderPayment';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
}));

describe('createOrderPayment', () => {
    const mockOrderPaymentsInsert = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        mockOrderPaymentsInsert.mockResolvedValue({ error: null });

        vi.mocked(createClient).mockResolvedValue({
            auth: {
                getUser: () => Promise.resolve({ data: { user: { id: 'admin-id', user_metadata: { role: 'admin' } } }, error: null }),
            },
            from: (table: string) => {
                if (table === 'order_payments') {
                    return {
                        insert: mockOrderPaymentsInsert,
                    };
                }
                return {};
            },
        } as any);
    });

    it('stores payment and relies on DB triggers for summary updates', async () => {
        const paymentData = {
            orderId: 'c2e811c7-c752-4011-8012-1f4803d29a00',
            direction: 'in' as const,
            kind: 'anticipo' as const,
            method: 'efectivo' as const,
            amount: 300,
        };

        const result = await createOrderPayment(paymentData);

        expect(result.success).toBe(true);

        // Check that it mapped 'amount' to 'amount_mxn' and 'orderId' to 'order_id'
        expect(mockOrderPaymentsInsert).toHaveBeenCalledWith(expect.objectContaining({
            order_id: paymentData.orderId,
            amount_mxn: paymentData.amount,
            direction: paymentData.direction,
            kind: paymentData.kind,
            method: paymentData.method,
            created_by: 'admin-id',
        }));

        // The action NO LONGER updates the order table directly.
        // We do not expect any call to 'orders' table.
    });
});
