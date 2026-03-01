'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { reportError } from '@/lib/monitoring';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import { updateOrderStatusPayloadSchema, canTransition } from '@/lib/schemas/internal/order-status';
import type { UpdateOrderStatusPayload } from '@/lib/schemas/internal/order-status';
import type { DbOrderStatus } from '@/types/database-enums';

export interface UpdateOrderStatusResult {
    success: boolean;
    error?: string;
}

/**
 * updateOrderStatus
 * Updates the order_status of an order.
 * - Transitions are validated against a state machine.
 * - History logging is handled automatically by DB filters and triggers.
 */
export async function updateOrderStatus(payload: UpdateOrderStatusPayload): Promise<UpdateOrderStatusResult> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'No autenticado' };
        }

        const role = getUserRole(user.user_metadata);
        if (!hasPermission(role, 'orders:update') && !hasPermission(role, 'admin:all')) {
            return { success: false, error: 'Permisos insuficientes' };
        }

        const parsed = updateOrderStatusPayloadSchema.safeParse(payload);
        if (!parsed.success) {
            return { success: false, error: 'Payload inválido' };
        }

        const { orderId, newStatus } = parsed.data;

        // Fetch current status to validate transition
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: order, error: fetchErr } = await (supabase as any)
            .from('orders')
            .select('order_status, user_id')
            .eq('id', orderId)
            .single();

        if (fetchErr || !order) {
            return { success: false, error: 'Pedido no encontrado' };
        }

        // RBAC / Ownership check
        if (order.user_id !== user.id && !hasPermission(role, 'admin:all')) {
            return { success: false, error: 'No autorizado' };
        }

        const currentStatus = order.order_status as DbOrderStatus;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!canTransition(currentStatus as any, newStatus as any)) {
            return {
                success: false,
                error: `Transición no permitida: de ${currentStatus} a ${newStatus}`
            };
        }

        // If idempotent, just return success
        if (currentStatus === newStatus) return { success: true };

        const adminSupabase = await createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateErr } = await (adminSupabase as any)
            .from('orders')
            .update({ order_status: newStatus as DbOrderStatus })
            .eq('id', orderId);

        if (updateErr) {
            reportError(updateErr, { action: 'updateOrderStatus', orderId });
            return { success: false, error: 'Fallo al actualizar el pedido' };
        }

        // NO MANUAL HISTORY INSERT NEEDED.
        // The Postgres trigger 'order_status_history_trigger' handles it.

        return { success: true };

    } catch (error) {
        reportError(error, { action: 'updateOrderStatus' });
        return { success: false, error: 'Error inesperado' };
    }
}
