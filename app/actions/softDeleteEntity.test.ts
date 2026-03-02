import { describe, it, expect, vi, beforeEach } from 'vitest';
import { softDeleteEntity } from './softDeleteEntity';
import { requirePermission } from '@/lib/auth/requirePermission';
import { createAdminClient } from '@/lib/supabase/server';

vi.mock('@/lib/auth/requirePermission', () => ({
    requirePermission: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
    createAdminClient: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
}));

describe('CRM CRUD Operations (Soft Delete)', () => {
    let mockUpdate: ReturnType<typeof vi.fn>;
    let mockEq: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();

        mockEq = vi.fn().mockResolvedValue({ error: null });
        mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

        const mockSupabase = {
            from: vi.fn().mockReturnValue({ update: mockUpdate }),
        };

        vi.mocked(createAdminClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createAdminClient>>);
        vi.mocked(requirePermission).mockResolvedValue({ user: { id: 'admin-123' } } as unknown as Awaited<ReturnType<typeof requirePermission>>);
    });

    it('denies soft delete if user lacks admin:all permission', async () => {
        vi.mocked(requirePermission).mockResolvedValue({ status: 'error', message: 'No access' } as unknown as Awaited<ReturnType<typeof requirePermission>>);

        const result = await softDeleteEntity('orders', 'order-123');

        expect(result.success).toBe(false);
        expect(result.error).toBe('No access');
        expect(createAdminClient).not.toHaveBeenCalled();
    });

    it('soft deletes an order correctly', async () => {
        const result = await softDeleteEntity('orders', 'order-123');

        expect(result.success).toBe(true);
        expect(createAdminClient).toHaveBeenCalled();
        const mockFrom = await createAdminClient();
        expect(mockFrom.from).toHaveBeenCalledWith('orders');
        expect(mockUpdate).toHaveBeenCalledWith({ deleted_at: expect.any(String) });
        expect(mockEq).toHaveBeenCalledWith('id', 'order-123');
    });

    it('soft deletes a customer correctly', async () => {
        const result = await softDeleteEntity('customers', 'cust-456');

        expect(result.success).toBe(true);
        const mockFrom = await createAdminClient();
        expect(mockFrom.from).toHaveBeenCalledWith('customers');
        expect(mockEq).toHaveBeenCalledWith('id', 'cust-456');
    });

    it('soft deletes a lead correctly (numeric ID)', async () => {
        const result = await softDeleteEntity('leads', 789);

        expect(result.success).toBe(true);
        const mockFrom = await createAdminClient();
        expect(mockFrom.from).toHaveBeenCalledWith('leads');
        expect(mockEq).toHaveBeenCalledWith('id', 789);
    });

    it('handles database errors gracefully', async () => {
        mockEq.mockResolvedValueOnce({ error: new Error('DB Error') });

        const result = await softDeleteEntity('profiles', 'user-abc');

        expect(result.success).toBe(false);
        expect(result.error).toBe('No se pudo eliminar el registro.');
    });
});
