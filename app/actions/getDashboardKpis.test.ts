/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { getDashboardKpis } from './getDashboardKpis';
import { createClient } from '@/lib/supabase/server';

const mockSelect = vi.fn();
const mockGte = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
}));

describe('getDashboardKpis', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockFrom.mockReturnValue({ select: mockSelect });
        mockSelect.mockReturnValue({ gte: mockGte });
        mockGte.mockResolvedValue({ data: [], error: null });

        vi.mocked(createClient).mockResolvedValue({
            auth: {
                getUser: () => Promise.resolve({ data: { user: { id: 'test-user', user_metadata: { role: 'admin' } } }, error: null }),
            },
            from: mockFrom,
        } as unknown as any);

        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns empty KPIs when no orders exist', async () => {
        // When 'all_time', mockSelect is directly awaited
        mockSelect.mockResolvedValueOnce({ data: [], error: null });

        const finalResult = await getDashboardKpis('all_time');

        expect(finalResult.success).toBe(true);
        expect(finalResult.data).toEqual({
            totalOrders: 0,
            scheduledToday: 0,
            pendingOrders: 0,
            revenueTotal: 0,
            currency: 'MXN'
        });
    });

    it('calculates KPIs correctly from orders', async () => {
        vi.setSystemTime(new Date('2026-02-28T12:00:00Z'));

        const mockOrders = [
            { status: 'draft', total_amount: 1000 },
            { status: 'pending_payment', total_amount: 1500 },
            { status: 'scheduled', total_amount: 2000, delivery_date: '2026-02-28T14:00:00Z' },
            { status: 'scheduled', total_amount: 2000, delivery_date: '2026-03-01T14:00:00Z' },
            { status: 'cancelled', total_amount: 5000 },
            { status: 'delivered', total_amount: 800 },
        ];

        mockGte.mockResolvedValueOnce({ data: mockOrders, error: null });

        const result = await getDashboardKpis('current_month');

        expect(result.success).toBe(true);
        // Total orders: 6
        // Pending: draft + pending_payment = 2
        // Scheduled today: 1 (only the one on 02-28)
        // Revenue: 1000 + 1500 + 2000 + 2000 + 800 = 7300 (excluding 5000 cancelled)
        expect(result.data).toEqual({
            totalOrders: 6,
            pendingOrders: 2,
            scheduledToday: 1,
            revenueTotal: 7300,
            currency: 'MXN'
        });
    });
});
