'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { reportError } from '@/lib/monitoring';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import { createOrderPaymentPayloadSchema } from '@/lib/schemas/internal/order-payments';
import type { CreateOrderPaymentPayload } from '@/lib/schemas/internal/order-payments';
import type { Database } from '@/types/database';

export interface CreateOrderPaymentResult {
    success: boolean;
    error?: string;
}

/**
 * createOrderPayment
 * Records a payment event in the order ledger.
 * - Balance recomputation is handled automatically by DB triggers.
 * - RBAC enforced for order updates.
 */
export async function createOrderPayment(payload: CreateOrderPaymentPayload): Promise<CreateOrderPaymentResult> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, error: 'No autenticado' };
        }

        const role = getUserRole(user.user_metadata);
        if (!hasPermission(role, 'orders:update') && !hasPermission(role, 'admin:all')) {
            return { success: false, error: 'Permisos insuficientes' };
        }

        const parsedPayload = createOrderPaymentPayloadSchema.safeParse(payload);
        if (!parsedPayload.success) {
            return { success: false, error: 'Datos de pago inválidos' };
        }

        const data = parsedPayload.data;
        const paidAt = data.paidAt ? new Date(data.paidAt).toISOString() : new Date().toISOString();

        // Canonical mapping to amount_mxn
        const insertPayload: Database['public']['Tables']['order_payments']['Insert'] = {
            order_id: data.orderId,
            direction: data.direction,
            kind: data.kind,
            method: data.method,
            amount_mxn: data.amount,
            paid_at: paidAt,
            reference: data.reference ?? null,
            receipt_number: data.receiptNumber ?? null,
            notes: data.notes ?? null,
            created_by: user.id,
        };

        const adminSupabase = await createAdminClient();
        const { error: insertError } = await adminSupabase
            .from('order_payments')
            .insert(insertPayload);

        if (insertError) {
            reportError(insertError, { action: 'createOrderPayment', orderId: data.orderId });
            return { success: false, error: 'No se pudo registrar el pago' };
        }

        // NO MANUAL BALANCE UPDATE NEEDED HERE.
        // The Postgres trigger 'recompute_order_payments_trigger' handles everything.

        return { success: true };
    } catch (error) {
        reportError(error, { action: 'createOrderPayment:unexpected' });
        return { success: false, error: 'Error inesperado al registrar pago' };
    }
}
