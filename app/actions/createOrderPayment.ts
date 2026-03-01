'use server';

import { createClient } from '@/lib/supabase/server';
import { reportError } from '@/lib/monitoring';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import { createOrderPaymentPayloadSchema } from '@/lib/schemas/internal/order-payments';
import type { CreateOrderPaymentPayload } from '@/lib/schemas/internal/order-payments';
import { summarizePayments } from '@/lib/logic/orderPayments';

export interface CreateOrderPaymentResult {
    success: boolean;
    error?: string;
}

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

        const { error: insertError } = await supabase
            .from('order_payments')
            .insert({
                order_id: data.orderId,
                direction: data.direction,
                kind: data.kind,
                method: data.method,
                amount: data.amount,
                paid_at: paidAt,
                reference: data.reference ?? null,
                receipt_number: data.receiptNumber ?? null,
                notes: data.notes ?? null,
                created_by: user.id,
            });

        if (insertError) {
            reportError(insertError, { action: 'createOrderPayment', orderId: data.orderId });
            return { success: false, error: 'No se pudo registrar el pago' };
        }

        const [{ data: orderRow, error: orderError }, { data: paymentsRows, error: paymentsError }] = await Promise.all([
            supabase
                .from('orders')
                .select('total_with_vat, total_amount')
                .eq('id', data.orderId)
                .single(),
            supabase
                .from('order_payments')
                .select('amount, direction, paid_at')
                .eq('order_id', data.orderId)
                .is('voided_at', null),
        ]);

        if (orderError || paymentsError || !orderRow) {
            reportError(orderError || paymentsError, { action: 'createOrderPayment:summary', orderId: data.orderId });
            return { success: false, error: 'No se pudo recalcular el saldo del pedido' };
        }

        const totalWithVat = Number(orderRow.total_with_vat || orderRow.total_amount || 0);
        const summary = summarizePayments(totalWithVat, paymentsRows || []);

        const { error: updateOrderError } = await supabase
            .from('orders')
            .update({
                payment_status: summary.paymentStatus,
                balance_amount: summary.balanceAmount,
                payments_summary_json: {
                    paid_amount: summary.paidAmount,
                    balance_amount: summary.balanceAmount,
                    last_paid_at: summary.lastPaidAt,
                },
            })
            .eq('id', data.orderId);

        if (updateOrderError) {
            reportError(updateOrderError, { action: 'createOrderPayment:updateOrder', orderId: data.orderId });
            return { success: false, error: 'Pago guardado pero no se pudo actualizar el resumen' };
        }

        return { success: true };
    } catch (error) {
        reportError(error, { action: 'createOrderPayment:unexpected' });
        return { success: false, error: 'Error inesperado al registrar pago' };
    }
}
