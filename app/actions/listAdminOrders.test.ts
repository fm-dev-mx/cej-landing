/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listAdminOrders } from './listAdminOrders';
import { createAdminClient, createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
    createAdminClient: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
}));

describe('listAdminOrders', () => {
    const queryBuilder: Record<string, any> = {};

    beforeEach(() => {
        vi.clearAllMocks();

        queryBuilder.range = vi.fn(() => queryBuilder);
        queryBuilder.order = vi.fn(() => queryBuilder);
        queryBuilder.eq = vi.fn(() => queryBuilder);
        queryBuilder.ilike = vi.fn(() => queryBuilder);
        queryBuilder.gte = vi.fn(() => queryBuilder);
        queryBuilder.lte = vi.fn(() => queryBuilder);
        queryBuilder.then = (cb: (value: unknown) => unknown) =>
            Promise.resolve({ data: [], count: 0, error: null }).then(cb);

        vi.mocked(createClient).mockResolvedValue({
            auth: { getUser: () => Promise.resolve({ data: { user: { id: 'admin-id', user_metadata: { role: 'admin' } } } }) },
        } as any);

        vi.mocked(createAdminClient).mockResolvedValue({
            from: () => ({
                select: () => queryBuilder,
            }),
        } as any);
    });

    it('returns paginated result with defaults', async () => {
        const result = await listAdminOrders();
        expect(result.success).toBe(true);
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(20);
        expect(result.orders).toEqual([]);
    });

    it('applies filter conditions', async () => {
        await listAdminOrders({
            status: 'draft',
            payment_status: 'pending',
            folio: 'ABC',
            dateFrom: '2026-01-01',
            dateTo: '2026-01-31',
            sellerId: 'c2e811c7-c752-4011-8012-1f4803d29a00',
        });

        expect(queryBuilder.eq).toHaveBeenCalledWith('order_status', 'draft');
        expect(queryBuilder.eq).toHaveBeenCalledWith('payment_status', 'pending');
        expect(queryBuilder.ilike).toHaveBeenCalledWith('folio', '%ABC%');
        expect(queryBuilder.gte).toHaveBeenCalledWith('scheduled_date', '2026-01-01');
        expect(queryBuilder.lte).toHaveBeenCalledWith('scheduled_date', '2026-01-31');
        expect(queryBuilder.eq).toHaveBeenCalledWith('seller_id', 'c2e811c7-c752-4011-8012-1f4803d29a00');
    });
});

