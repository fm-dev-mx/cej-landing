'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { reportError } from '@/lib/monitoring';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import { orderIdSchema } from '@/lib/schemas/internal/order-admin';
import type { CustomerOption, OrderDetail, ProfileOption, ServiceSlotOption } from '@/types/internal/order-admin';
import type { Database } from '@/types/database';

export interface GetAdminOrderByIdResult {
    success: boolean;
    data?: OrderDetail;
    error?: string;
}

export async function getAdminOrderById(orderId: string): Promise<GetAdminOrderByIdResult> {
    try {
        const parsed = orderIdSchema.safeParse(orderId);
        if (!parsed.success) {
            return { success: false, error: 'ID de pedido inválido' };
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Usuario no autenticado' };
        }

        const role = getUserRole(user.user_metadata);
        if (!hasPermission(role, 'orders:view') && !hasPermission(role, 'admin:all')) {
            return { success: false, error: 'No tienes permiso para ver esta sección' };
        }

        const adminSupabase = await createAdminClient();
        const { data: order, error: orderError } = await adminSupabase
            .from('orders')
            .select('*')
            .eq('id', parsed.data)
            .single();

        const typedOrder = order as Database['public']['Tables']['orders']['Row'] | null;
        if (orderError || !typedOrder) {
            return { success: false, error: 'Pedido no encontrado' };
        }

        const [paymentsRes, historyRes, fiscalRes] = await Promise.all([
            adminSupabase
                .from('order_payments')
                .select('*')
                .eq('order_id', typedOrder.id)
                .order('paid_at', { ascending: false }),
            adminSupabase
                .from('order_status_history')
                .select('*')
                .eq('order_id', typedOrder.id)
                .order('changed_at', { ascending: false }),
            adminSupabase
                .from('order_fiscal_data')
                .select('*')
                .eq('order_id', typedOrder.id)
                .maybeSingle(),
        ]);

        const profileIds = Array.from(
            new Set([typedOrder.user_id, typedOrder.seller_id, typedOrder.created_by, ...((paymentsRes.data || []) as Array<{ created_by: string | null }>).map((p) => p.created_by), ...((historyRes.data || []) as Array<{ changed_by: string | null }>).map((h) => h.changed_by)].filter(Boolean))
        ) as string[];

        let profileMap: Record<string, ProfileOption> = {};
        if (profileIds.length > 0) {
            const { data: profiles } = await adminSupabase
                .from('profiles')
                .select('id, full_name, email, phone')
                .in('id', profileIds);
            profileMap = Object.fromEntries(
                (profiles || []).map((profile) => [profile.id, profile])
            );
        }

        let serviceSlot: ServiceSlotOption | null = null;
        if (typedOrder.scheduled_slot_code) {
            const { data: slot } = await adminSupabase
                .from('service_slots')
                .select('*')
                .eq('slot_code', typedOrder.scheduled_slot_code)
                .maybeSingle();
            serviceSlot = slot || null;
        }

        let customer: CustomerOption | null = null;
        if (typedOrder.customer_id) {
            const { data: customerRow } = await adminSupabase
                .from('customers')
                .select('id, display_name, primary_phone_norm, primary_email_norm')
                .eq('id', typedOrder.customer_id)
                .maybeSingle();
            customer = (customerRow as CustomerOption | null) || null;
        }

        const mappedPayments = ((paymentsRes.data || []) as Array<Database['public']['Tables']['order_payments']['Row']>)
            .map((payment) => ({
                ...payment,
                amount_mxn: Number(payment.amount_mxn || 0),
            }));
        return {
            success: true,
            data: {
                order: typedOrder,
                payments: mappedPayments,
                statusHistory: ((historyRes.data || []) as Database['public']['Tables']['order_status_history']['Row'][]),
                fiscalData: (fiscalRes.data as Database['public']['Tables']['order_fiscal_data']['Row'] | null) || null,
                profiles: profileMap,
                serviceSlot,
                customer,
            },
        };
    } catch (error) {
        reportError(error, { action: 'getAdminOrderById' });
        return { success: false, error: 'Error inesperado al consultar el pedido' };
    }
}
