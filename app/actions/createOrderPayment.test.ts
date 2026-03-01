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
    const mockOrdersSelect = vi.fn();
    const mockOrdersEq = vi.fn();
    const mockOrdersSingle = vi.fn();
    const mockOrderPaymentsSelect = vi.fn();
    const mockOrderPaymentsEq = vi.fn();
    const mockOrderPaymentsIs = vi.fn();
    const mockOrdersUpdate = vi.fn();
    const mockOrdersUpdateEq = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        mockOrderPaymentsInsert.mockResolvedValue({ error: null });

        mockOrdersSingle.mockResolvedValue({
            data: { total_with_vat: 1000, total_amount: 1000 },
            error: null,
        });
        mockOrdersEq.mockReturnValue({ single: mockOrdersSingle });
        mockOrdersSelect.mockReturnValue({ eq: mockOrdersEq });

        mockOrderPaymentsIs.mockResolvedValue({
            data: [
                { amount: 300, direction: 'in', paid_at: '2026-02-15T10:00:00.000Z' },
                { amount: 200, direction: 'in', paid_at: '2026-02-16T10:00:00.000Z' },
            ],
            error: null,
        });
        mockOrderPaymentsEq.mockReturnValue({ is: mockOrderPaymentsIs });
        mockOrderPaymentsSelect.mockReturnValue({ eq: mockOrderPaymentsEq });

        mockOrdersUpdateEq.mockResolvedValue({ error: null });
        mockOrdersUpdate.mockReturnValue({ eq: mockOrdersUpdateEq });

        vi.mocked(createClient).mockResolvedValue({
            auth: {
                getUser: () => Promise.resolve({ data: { user: { id: 'admin-id', user_metadata: { role: 'admin' } } }, error: null }),
            },
            from: (table: string) => {
                if (table === 'order_payments') {
                    return {
                        insert: mockOrderPaymentsInsert,
                        select: mockOrderPaymentsSelect,
                    };
                }
                if (table === 'orders') {
                    return {
                        select: mockOrdersSelect,
                        update: mockOrdersUpdate,
                    };
                }
                return {};
            },
        } as any);
    });

    it('stores payment and updates balance summary on order', async () => {
        const paymentData = {
            orderId: 'c2e811c7-c752-4011-8012-1f4803d29a00',
            direction: 'in' as const,
            kind: 'anticipo' as const,
            method: 'efectivo' as const,
            amount: 300,
        };

        const result = await createOrderPayment(paymentData);

        expect(result.success).toBe(true);
        expect(mockOrderPaymentsInsert).toHaveBeenCalledWith(expect.objectContaining({
            ...paymentData,
            created_by: 'admin-id',
        }));
        expect(mockOrdersUpdate).toHaveBeenCalledWith(expect.objectContaining({
            payment_status: 'partial',
            balance_amount: 500,
            payments_summary_json: expect.objectContaining({
                paid_amount: 500,
                balance_amount: 500,
            }),
        }));
    });
});
