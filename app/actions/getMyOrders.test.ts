/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMyOrders } from './getMyOrders';
import { createClient } from '@/lib/supabase/server';

const { mockLimit, mockOrder, mockSelect, mockFrom, mockLt } = vi.hoisted(() => ({
    mockLimit: vi.fn(),
    mockOrder: vi.fn(),
    mockSelect: vi.fn(),
    mockFrom: vi.fn(),
    mockLt: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
}));

describe('getMyOrders', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockSelect.mockReturnValue({ order: mockOrder });
        mockOrder.mockReturnValue({ limit: mockLimit });
        mockLt.mockImplementation(() => Promise.resolve({ data: [], error: null }));
        mockLimit.mockImplementation(() => Promise.resolve({ data: [], error: null }));

        vi.mocked(createClient).mockResolvedValue({
            auth: {
                getUser: () => Promise.resolve({ data: { user: { id: 'user-1', user_metadata: { role: 'admin' } } }, error: null }),
            },
            from: mockFrom.mockReturnValue({
                select: mockSelect,
            }),
        } as unknown as any);
    });

    it('returns mapped orders and next cursor when page is full', async () => {
        const data = Array.from({ length: 2 }).map((_, idx) => ({
            id: `order-${idx}`,
            folio: `FOL-${idx}`,
            order_status: 'draft',
            payment_status: 'pending',
            total_with_vat: 1000,
            balance_amount: 1000,
            ordered_at: `2026-02-0${idx + 1}T12:00:00.000Z`,
            scheduled_date: null,
        }));

        mockLimit.mockResolvedValueOnce({ data, error: null });
        const result = await getMyOrders(undefined, 2);

        expect(result.success).toBe(true);
        expect(result.orders).toHaveLength(2);
        expect(result.nextCursor).toBe('2026-02-02T12:00:00.000Z');
    });

    it('applies cursor filter on ordered_at when cursor exists', async () => {
        const cursor = '2026-02-20T00:00:00.000Z';
        mockLimit.mockReturnValueOnce({ lt: mockLt });

        await getMyOrders(cursor, 10);

        expect(mockLt).toHaveBeenCalledWith('ordered_at', cursor);
    });

    it('returns unauthenticated error when user is missing', async () => {
        vi.mocked(createClient).mockResolvedValueOnce({
            auth: { getUser: () => Promise.resolve({ data: { user: null }, error: null }) },
        } as unknown as any);

        const result = await getMyOrders();

        expect(result.success).toBe(false);
        expect(result.error).toContain('no autenticado');
    });

    it('returns db error payload when query fails', async () => {
        mockLimit.mockResolvedValueOnce({ data: null, error: new Error('query failed') });

        const result = await getMyOrders();

        expect(result.success).toBe(false);
        expect(result.error).toContain('Error al obtener los pedidos');
    });
});
