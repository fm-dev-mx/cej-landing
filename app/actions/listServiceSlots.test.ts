/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listServiceSlots } from './listServiceSlots';
import { createAdminClient, createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
    createAdminClient: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
}));

describe('listServiceSlots', () => {
    const queryBuilder: Record<string, any> = {};

    beforeEach(() => {
        vi.clearAllMocks();

        queryBuilder.order = vi.fn(() => queryBuilder);
        queryBuilder.then = (cb: (value: unknown) => unknown) =>
            Promise.resolve({ data: [{ slot_code: 'morning', label: 'Morning' }], error: null }).then(cb);

        vi.mocked(createClient).mockResolvedValue({
            auth: { getUser: () => Promise.resolve({ data: { user: { id: 'admin-id', user_metadata: { role: 'admin' } } } }) },
        } as any);

        vi.mocked(createAdminClient).mockResolvedValue({
            from: () => ({
                select: () => queryBuilder,
            }),
        } as any);
    });

    it('returns service slots correctly', async () => {
        const result = await listServiceSlots();
        expect(result.success).toBe(true);
        expect(result.slots.length).toBe(1);
        expect(result.slots[0].slot_code).toBe('morning');
        expect(queryBuilder.order).toHaveBeenCalledWith('start_time', { ascending: true });
    });

    it('returns error if user lacks view permissions', async () => {
        vi.mocked(createClient).mockResolvedValue({
            auth: { getUser: () => Promise.resolve({ data: { user: { id: 'user-id', user_metadata: { role: 'user' } } } }) },
        } as any);

        const result = await listServiceSlots();
        expect(result.success).toBe(false);
        expect(result.error).toBe('Sin permisos');
    });

    it('returns error if query fails', async () => {
        queryBuilder.then = (cb: (value: unknown) => unknown) =>
            Promise.resolve({ data: null, error: new Error('Db Error') }).then(cb);

        const result = await listServiceSlots();
        expect(result.success).toBe(false);
        expect(result.error).toBe('No se pudieron cargar las franjas de servicio');
    });
});
