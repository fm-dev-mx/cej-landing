'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { reportError } from '@/lib/monitoring';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import { cancelOrderPayloadSchema } from '@/lib/schemas/internal/order-admin';
import { canTransition } from '@/lib/schemas/internal/order-status';
import type { CancelOrderPayload } from '@/types/internal/order-admin';
import type { DbOrderStatus } from '@/types/database-enums';
import { updateOrderStatus } from './updateOrderStatus';

export interface CancelAdminOrderResult {
    success: boolean;
    error?: string;
}

export async function cancelAdminOrder(payload: CancelOrderPayload): Promise<CancelAdminOrderResult> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'No autenticado' };

        const role = getUserRole(user.user_metadata);
        if (!hasPermission(role, 'orders:update') && !hasPermission(role, 'admin:all')) {
            return { success: false, error: 'No tienes permisos para cancelar pedidos' };
        }

        const parsed = cancelOrderPayloadSchema.safeParse(payload);
        if (!parsed.success) {
            return { success: false, error: 'Datos inválidos para cancelar el pedido' };
        }

        const { orderId, reason } = parsed.data;
        const adminSupabase = await createAdminClient();

        const { data: currentOrder, error: currentError } = await adminSupabase
            .from('orders')
            .select('order_status')
            .eq('id', orderId)
            .single();

        const typedCurrentOrder = currentOrder as { order_status: DbOrderStatus } | null;
        if (currentError || !typedCurrentOrder) {
            return { success: false, error: 'Pedido no encontrado' };
        }

        const currentStatus = typedCurrentOrder.order_status;
        if (!canTransition(currentStatus, 'cancelled')) {
            return { success: false, error: `No se puede cancelar un pedido en estado ${currentStatus}` };
        }

        const statusUpdate = await updateOrderStatus({
            orderId,
            newStatus: 'cancelled',
            reason,
        });
        if (!statusUpdate.success) {
            return { success: false, error: statusUpdate.error || 'No se pudo cancelar el pedido' };
        }

        return { success: true };
    } catch (error) {
        reportError(error, { action: 'cancelAdminOrder', phase: 'unexpected' });
        return { success: false, error: 'Error inesperado al cancelar el pedido' };
    }
}
