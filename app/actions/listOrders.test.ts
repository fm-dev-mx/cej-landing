/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listOrders } from './listOrders';
import { createClient } from '@/lib/supabase/server';

const mockOrder = vi.fn();
const mockOrder2 = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();
const mockIlike = vi.fn();
const mockFrom = vi.fn();

import { requirePermission } from '@/lib/auth/requirePermission';

vi.mock('@/lib/auth/requirePermission', () => ({
    requirePermission: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
}));

describe('listOrders', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockFrom.mockReturnValue({ select: mockSelect });
        mockSelect.mockReturnValue({ order: mockOrder });
        mockOrder.mockReturnValue({ order: mockOrder2 });

        // Base promise simulation on the query builder
        mockOrder2.mockImplementation(() => Promise.resolve({ data: [], error: null }));
        mockOrder2.mockReturnValue({ eq: mockEq, gte: mockGte, lte: mockLte, ilike: mockIlike });

        mockEq.mockReturnValue({ gte: mockGte, lte: mockLte, ilike: mockIlike, then: (cb: any) => Promise.resolve({ data: [], error: null }).then(cb) });
        mockGte.mockReturnValue({ lte: mockLte, ilike: mockIlike, then: (cb: any) => Promise.resolve({ data: [], error: null }).then(cb) });
        mockLte.mockReturnValue({ ilike: mockIlike, then: (cb: any) => Promise.resolve({ data: [], error: null }).then(cb) });
        mockIlike.mockReturnValue({ then: (cb: any) => Promise.resolve({ data: [], error: null }).then(cb) });

        vi.mocked(requirePermission).mockResolvedValue({
            user: { id: 'admin-id', role: 'admin' },
        } as any);

        vi.mocked(createClient).mockResolvedValue({
            auth: {
                getUser: () => Promise.resolve({ data: { user: { id: 'admin-1', user_metadata: { role: 'admin' } } }, error: null }),
            },
            from: mockFrom,
        } as unknown as any);
    });

    it('returns empty array when no orders', async () => {
        const result = await listOrders();
        expect(result.success).toBe(true);
        expect(result.orders).toEqual([]);
    });

    it('applies filters correctly using the canonical schema', async () => {
        await listOrders({ status: 'confirmed', startDate: '2026-01-01', endDate: '2026-12-31', folio: '123' });

        expect(mockEq).toHaveBeenCalledWith('order_status', 'confirmed');
        expect(mockGte).toHaveBeenCalledWith('scheduled_date', '2026-01-01');
        expect(mockLte).toHaveBeenCalledWith('scheduled_date', '2026-12-31');
        expect(mockIlike).toHaveBeenCalledWith('folio', '%123%');
    });

    it('returns error if not authenticated', async () => {
        vi.mocked(requirePermission).mockResolvedValue({
            status: 'error',
            message: 'Usuario no autenticado'
        } as any);

        const result = await listOrders();
        expect(result.success).toBe(false);
        expect(result.error).toContain('Usuario no autenticado');
    });
});
