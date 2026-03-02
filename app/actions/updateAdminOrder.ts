'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { reportError } from '@/lib/monitoring';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import { orderUpdatePayloadSchema } from '@/lib/schemas/internal/order-admin';
import type { OrderUpdatePayload } from '@/types/internal/order-admin';
import type { Database } from '@/types/database';

export interface UpdateAdminOrderResult {
    success: boolean;
    error?: string;
}

export async function updateAdminOrder(payload: OrderUpdatePayload): Promise<UpdateAdminOrderResult> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'No autenticado' };

        const role = getUserRole(user.user_metadata);
        if (!hasPermission(role, 'orders:edit') && !hasPermission(role, 'admin:all')) {
            return { success: false, error: 'No tienes permisos para editar pedidos' };
        }

        const parsed = orderUpdatePayloadSchema.safeParse(payload);
        if (!parsed.success) {
            return { success: false, error: 'Datos inválidos para actualizar el pedido' };
        }

        const data = parsed.data;
        const updatePayload: Database['public']['Tables']['orders']['Update'] = {};

        if (Object.prototype.hasOwnProperty.call(data, 'delivery_address_text')) updatePayload.delivery_address_text = data.delivery_address_text ?? null;
        if (Object.prototype.hasOwnProperty.call(data, 'delivery_address_id')) updatePayload.delivery_address_id = data.delivery_address_id ?? null;
        if (Object.prototype.hasOwnProperty.call(data, 'scheduled_date')) updatePayload.scheduled_date = data.scheduled_date ?? null;
        if (Object.prototype.hasOwnProperty.call(data, 'scheduled_slot_code')) updatePayload.scheduled_slot_code = data.scheduled_slot_code ?? null;
        if (Object.prototype.hasOwnProperty.call(data, 'scheduled_time_label')) updatePayload.scheduled_time_label = data.scheduled_time_label ?? null;
        if (Object.prototype.hasOwnProperty.call(data, 'scheduled_window_start')) updatePayload.scheduled_window_start = data.scheduled_window_start ?? null;
        if (Object.prototype.hasOwnProperty.call(data, 'scheduled_window_end')) updatePayload.scheduled_window_end = data.scheduled_window_end ?? null;
        if (Object.prototype.hasOwnProperty.call(data, 'notes')) updatePayload.notes = data.notes ?? null;
        if (Object.prototype.hasOwnProperty.call(data, 'external_ref')) updatePayload.external_ref = data.external_ref ?? null;
        if (Object.prototype.hasOwnProperty.call(data, 'seller_id')) updatePayload.seller_id = data.seller_id ?? null;
        if (Object.prototype.hasOwnProperty.call(data, 'legacy_product_raw')) updatePayload.legacy_product_raw = data.legacy_product_raw ?? null;
        if (Object.prototype.hasOwnProperty.call(data, 'import_source')) updatePayload.import_source = data.import_source ?? null;
        if (Object.prototype.hasOwnProperty.call(data, 'import_batch_id')) updatePayload.import_batch_id = data.import_batch_id ?? null;
        if (Object.prototype.hasOwnProperty.call(data, 'import_row_hash')) updatePayload.import_row_hash = data.import_row_hash ?? null;
        if (Object.prototype.hasOwnProperty.call(data, 'legacy_folio_raw')) updatePayload.legacy_folio_raw = data.legacy_folio_raw ?? null;
        if (Object.prototype.hasOwnProperty.call(data, 'utm_source')) updatePayload.utm_source = data.utm_source ?? null;
        if (Object.prototype.hasOwnProperty.call(data, 'utm_medium')) updatePayload.utm_medium = data.utm_medium ?? null;
        if (Object.prototype.hasOwnProperty.call(data, 'utm_campaign')) updatePayload.utm_campaign = data.utm_campaign ?? null;

        if (Object.keys(updatePayload).length === 0) {
            return { success: false, error: 'No hay cambios para guardar' };
        }

        const adminSupabase = await createAdminClient();
        const { error } = await adminSupabase
            .from('orders')
            .update(updatePayload)
            .eq('id', data.orderId);

        if (error) {
            reportError(error, { action: 'updateAdminOrder', orderId: data.orderId });
            return { success: false, error: 'No se pudo actualizar el pedido' };
        }

        return { success: true };
    } catch (error) {
        reportError(error, { action: 'updateAdminOrder', phase: 'unexpected' });
        return { success: false, error: 'Error inesperado al actualizar el pedido' };
    }
}
