/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cancelAdminOrder } from './cancelAdminOrder';
import { createAdminClient, createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
    createAdminClient: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
}));

describe('cancelAdminOrder', () => {
    const mockSingle = vi.fn();
    const mockUpdateEq = vi.fn();
    const mockHistoryUpdateEq = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        const mockOrderSelect = {
            select: () => ({
                eq: () => ({ single: mockSingle }),
            }),
        };

        vi.mocked(createClient).mockResolvedValue({
            auth: { getUser: () => Promise.resolve({ data: { user: { id: 'admin-id', user_metadata: { role: 'admin' } } } }) },
            from: (table: string) => {
                if (table === 'orders') {
                    return mockOrderSelect;
                }
                return {};
            },
        } as any);

        const mockFrom = vi.fn((table: string) => {
            if (table === 'orders') {
                return {
                    ...mockOrderSelect,
                    update: () => ({ eq: mockUpdateEq }),
                };
            }
            if (table === 'order_status_history') {
                return {
                    select: () => ({
                        eq: () => ({
                            order: () => ({
                                limit: () => Promise.resolve({ data: [{ id: 'hist-1', to_status: 'cancelled' }] }),
                            }),
                        }),
                    }),
                    update: () => ({ eq: mockHistoryUpdateEq }),
                };
            }
            return {};
        });

        mockUpdateEq.mockResolvedValue({ error: null });
        mockHistoryUpdateEq.mockResolvedValue({ error: null });
        mockSingle.mockResolvedValue({ data: { order_status: 'draft', user_id: 'admin-id' }, error: null });

        vi.mocked(createAdminClient).mockResolvedValue({
            from: mockFrom,
        } as any);
    });

    it('cancels the order and returns success', async () => {
        const result = await cancelAdminOrder({
            orderId: 'c2e811c7-c752-4011-8012-1f4803d29a00',
            reason: 'Cliente solicitó cancelación.',
        });
        expect(result.success).toBe(true);
    });
});
