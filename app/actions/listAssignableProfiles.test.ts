/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listAssignableProfiles } from './listAssignableProfiles';
import { createAdminClient, createClient } from '@/lib/supabase/server';

import { requirePermission } from '@/lib/auth/requirePermission';

vi.mock('@/lib/auth/requirePermission', () => ({
    requirePermission: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
    createAdminClient: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
}));

describe('listAssignableProfiles', () => {
    const queryBuilder: Record<string, any> = {};

    beforeEach(() => {
        vi.clearAllMocks();

        queryBuilder.order = vi.fn(() => queryBuilder);
        queryBuilder.limit = vi.fn(() => queryBuilder);
        queryBuilder.or = vi.fn(() => queryBuilder);
        queryBuilder.then = (cb: (value: unknown) => unknown) =>
            Promise.resolve({ data: [{ id: '1', full_name: 'John Doe', email: 'x@x.com' }], error: null }).then(cb);

        vi.mocked(requirePermission).mockResolvedValue({
            user: { id: 'admin-id', role: 'admin' },
        } as any);

        vi.mocked(createAdminClient).mockResolvedValue({
            from: () => ({
                select: () => queryBuilder,
            }),
        } as any);
    });

    it('returns profiles correctly without query', async () => {
        const result = await listAssignableProfiles();
        expect(result.success).toBe(true);
        expect(result.profiles.length).toBe(1);
        expect(queryBuilder.limit).toHaveBeenCalledWith(25);
        expect(queryBuilder.or).not.toHaveBeenCalled();
    });

    it('applies query filter if passed', async () => {
        await listAssignableProfiles('John');
        expect(queryBuilder.or).toHaveBeenCalledWith('full_name.ilike.%John%,email.ilike.%John%');
    });

    it('returns error if user lacks view permissions', async () => {
        vi.mocked(requirePermission).mockResolvedValue({
            status: 'error',
            message: 'No tienes permisos suficientes para realizar esta acción.',
        } as any);

        const result = await listAssignableProfiles();
        expect(result.success).toBe(false);
        expect(result.error).toBe('No tienes permisos suficientes para realizar esta acción.');
    });

    it('returns error if query fails', async () => {
        queryBuilder.then = (cb: (value: unknown) => unknown) =>
            Promise.resolve({ data: null, error: new Error('Db Error') }).then(cb);

        const result = await listAssignableProfiles();
        expect(result.success).toBe(false);
        expect(result.error).toBe('No se pudieron cargar perfiles');
    });
});
