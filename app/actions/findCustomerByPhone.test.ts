/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { findCustomerByPhone } from './findCustomerByPhone';

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

describe('findCustomerByPhone', () => {
    const queryBuilder: Record<string, any> = {};

    beforeEach(() => {
        vi.clearAllMocks();

        queryBuilder.eq = vi.fn(() => queryBuilder);
        queryBuilder.is = vi.fn(() => queryBuilder);
        queryBuilder.maybeSingle = vi.fn(async () => ({
            data: { id: 'customer-1', display_name: 'Cliente Uno', primary_phone_norm: '526561234567' },
            error: null,
        }));

        vi.mocked(requirePermission).mockResolvedValue({
            user: { id: 'admin-id', role: 'admin' },
        } as any);

        vi.mocked(createAdminClient).mockResolvedValue({
            from: () => ({
                select: () => queryBuilder,
            }),
        } as any);
    });

    it('normalizes 10-digit numbers and finds exact customer', async () => {
        const result = await findCustomerByPhone('656 123 4567');
        expect(result.success).toBe(true);
        expect(result.normalizedPhone).toBe('526561234567');
        expect(queryBuilder.eq).toHaveBeenCalledWith('primary_phone_norm', '526561234567');
        expect(result.customer?.display_name).toBe('Cliente Uno');
    });

    it('returns no customer when exact match does not exist', async () => {
        queryBuilder.maybeSingle = vi.fn(async () => ({ data: null, error: null }));
        const result = await findCustomerByPhone('6561239999');
        expect(result.success).toBe(true);
        expect(result.customer).toBeUndefined();
    });

    it('returns permission error for unauthorized users', async () => {
        vi.mocked(requirePermission).mockResolvedValue({
            status: 'error',
            message: 'No tienes permisos suficientes para realizar esta acción.',
        } as any);

        const result = await findCustomerByPhone('6561234567');
        expect(result.success).toBe(false);
        expect(result.error).toBe('No tienes permisos suficientes para realizar esta acción.');
    });
});
