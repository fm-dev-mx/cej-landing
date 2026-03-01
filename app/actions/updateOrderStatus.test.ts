/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateOrderStatus } from './updateOrderStatus';
import { createClient } from '@/lib/supabase/server';

const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateEq = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
}));

describe('updateOrderStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
        mockSelect.mockReturnValue({ eq: mockEq });
        mockEq.mockReturnValue({ single: mockSingle });

        mockUpdate.mockReturnValue({ eq: mockUpdateEq });
        mockUpdateEq.mockResolvedValue({ error: null });

        vi.mocked(createClient).mockResolvedValue({
            auth: {
                getUser: () => Promise.resolve({ data: { user: { id: 'user-val', user_metadata: { role: 'admin' } } }, error: null }),
            },
            from: mockFrom,
        } as unknown as any);
    });

    it('successfully updates when transition is valid', async () => {
        mockSingle.mockResolvedValueOnce({ data: { status: 'draft', user_id: 'user-val' }, error: null });

        const result = await updateOrderStatus({
            orderId: 'c2e811c7-c752-4011-8012-1f4803d29a00',
            newStatus: 'pending_payment'
        });

        expect(result.success).toBe(true);
        expect(mockUpdateEq).toHaveBeenCalledWith('id', 'c2e811c7-c752-4011-8012-1f4803d29a00');
    });

    it('fails when transition is invalid on backend matrix', async () => {
        // e.g., delivered -> scheduled
        mockSingle.mockResolvedValueOnce({ data: { status: 'delivered', user_id: 'user-val' }, error: null });

        const result = await updateOrderStatus({
            orderId: 'c2e811c7-c752-4011-8012-1f4803d29a00',
            newStatus: 'scheduled'
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('Transición no permitida');
        expect(mockUpdateEq).not.toHaveBeenCalled();
    });

    it('returns unauthorized when user mismatch and not superadmin', async () => {
        // RLS fallback check
        vi.mocked(createClient).mockResolvedValue({
            auth: {
                // simple user not admin:all
                getUser: () => Promise.resolve({ data: { user: { id: 'other-user', user_metadata: { role: 'user' } } }, error: null }),
            },
            from: mockFrom,
        } as unknown as any);

        mockSingle.mockResolvedValueOnce({ data: { status: 'draft', user_id: 'secret-user' }, error: null });

        const result = await updateOrderStatus({
            orderId: 'c2e811c7-c752-4011-8012-1f4803d29a00',
            newStatus: 'pending_payment'
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain('No autorizado'); // from RLS fallback check
    });
});

