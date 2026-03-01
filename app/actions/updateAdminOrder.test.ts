/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateAdminOrder } from './updateAdminOrder';
import { createAdminClient, createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
    createAdminClient: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
    reportError: vi.fn(),
}));

describe('updateAdminOrder', () => {
    let mockFrom: any;
    let mockUpdate: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockUpdate = vi.fn().mockReturnThis();
        mockFrom = vi.fn().mockReturnValue({
            update: mockUpdate,
            eq: vi.fn().mockResolvedValue({ error: null })
        });

        vi.mocked(createClient).mockResolvedValue({
            auth: { getUser: () => Promise.resolve({ data: { user: { id: 'admin-id', user_metadata: { role: 'admin' } } } }) },
        } as any);

        vi.mocked(createAdminClient).mockResolvedValue({
            from: mockFrom,
        } as any);
    });

    it('returns error if no payload properties given', async () => {
        const result = await updateAdminOrder({ orderId: 'd0fc878d-ea81-424a-9da8-e9f02377b63f' });
        expect(result.success).toBe(false);
        expect(result.error).toBe('No hay cambios para guardar');
    });

    it('successfully calls supabase update', async () => {
        const result = await updateAdminOrder({ orderId: 'd0fc878d-ea81-424a-9da8-e9f02377b63f', notes: 'Urgent' });
        expect(result.success).toBe(true);
        expect(mockUpdate).toHaveBeenCalledWith({ notes: 'Urgent' });
        expect(mockFrom).toHaveBeenCalledWith('orders');
    });

    it('returns error if user lacks edit permissions', async () => {
        vi.mocked(createClient).mockResolvedValue({
            auth: { getUser: () => Promise.resolve({ data: { user: { id: 'user-id', user_metadata: { role: 'user' } } } }) },
        } as any);

        const result = await updateAdminOrder({ orderId: 'd0fc878d-ea81-424a-9da8-e9f02377b63f', notes: 'Urgent' });
        expect(result.success).toBe(false);
        expect(result.error).toBe('No tienes permisos para editar pedidos');
    });

    it('handles Zod validation errors', async () => {
        // missing orderId should fail zod
        const result = await updateAdminOrder({ notes: 'Urgent' } as any);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Datos inválidos para actualizar el pedido');
    });

    it('handles Supabase errors', async () => {
        mockFrom = vi.fn().mockReturnValue({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: new Error('Db Error') })
        });
        vi.mocked(createAdminClient).mockResolvedValue({
            from: mockFrom,
        } as any);

        const result = await updateAdminOrder({ orderId: 'd0fc878d-ea81-424a-9da8-e9f02377b63f', notes: 'Urgent' });
        expect(result.success).toBe(false);
        expect(result.error).toBe('No se pudo actualizar el pedido');
    });
});
