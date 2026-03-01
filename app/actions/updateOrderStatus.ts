'use server';

import { createClient } from '@/lib/supabase/server';
import { reportError } from '@/lib/monitoring';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import { updateOrderStatusPayloadSchema, canTransition } from '@/lib/schemas/internal/order-status';
import type { UpdateOrderStatusPayload } from '@/lib/schemas/internal/order-status';
import type { InternalOrderStatus } from '@/types/internal/order';

export interface UpdateOrderStatusResult {
    success: boolean;
    error?: string;
}

export async function updateOrderStatus(payload: UpdateOrderStatusPayload): Promise<UpdateOrderStatusResult> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'No autenticado' };
        }

        const role = getUserRole(user.user_metadata);
        // We require update permission to change statuses. Or admin:all.
        if (!hasPermission(role, 'orders:update') && !hasPermission(role, 'admin:all')) {
            return { success: false, error: 'Permisos insuficientes' };
        }

        const parsed = updateOrderStatusPayloadSchema.safeParse(payload);
        if (!parsed.success) {
            return { success: false, error: 'Payload inválido' };
        }

        const { orderId, newStatus } = parsed.data;

        // Fetch current status to validate transition
        const { data: order, error: fetchErr } = await supabase
            .from('orders')
            .select('status, user_id')
            .eq('id', orderId)
            .single();

        if (fetchErr || !order) {
            return { success: false, error: 'Pedido no encontrado' };
        }

        // RLS enforcement for standard users (though technically handled by RLS on UPDATE,
        // we preemptively validate since we need to check the transition anyways).
        if (order.user_id !== user.id && !hasPermission(role, 'admin:all')) {
            return { success: false, error: 'No autorizado' };
        }

        const currentStatus = order.status as InternalOrderStatus;

        if (!canTransition(currentStatus, newStatus as InternalOrderStatus)) {
            return {
                success: false,
                error: `Transición no permitida: de ${currentStatus} a ${newStatus}`
            };
        }

        // If idempotent, just return success
        if (currentStatus === newStatus) return { success: true };

        const { error: updateErr } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (updateErr) {
            reportError(updateErr, { action: 'updateOrderStatus', orderId });
            return { success: false, error: 'Fallo al actualizar el pedido' };
        }

        return { success: true };

    } catch (error) {
        reportError(error, { action: 'updateOrderStatus' });
        return { success: false, error: 'Error inesperado' };
    }
}
