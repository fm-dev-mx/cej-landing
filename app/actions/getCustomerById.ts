'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { reportError } from '@/lib/monitoring';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import type { CustomerDetail } from '@/types/internal/customer';
import type { Database } from '@/types/database';

export interface GetCustomerByIdResult {
    success: boolean;
    data?: CustomerDetail;
    error?: string;
}

function normalizeDateBounds(value: string | null): string | null {
    if (!value) return null;
    return value;
}

export async function getCustomerById(customerId: string): Promise<GetCustomerByIdResult> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Usuario no autenticado' };

        const role = getUserRole(user.user_metadata);
        if (!hasPermission(role, 'orders:view') && !hasPermission(role, 'admin:all')) {
            return { success: false, error: 'No tienes permiso para ver esta sección' };
        }

        const adminSupabase = await createAdminClient();
        const { data: customer, error: customerError } = await adminSupabase
            .from('customers')
            .select('*')
            .eq('id', customerId)
            .maybeSingle();

        if (customerError || !customer) {
            return { success: false, error: 'Cliente no encontrado' };
        }

        const [ordersRes, identitiesRes, leadsRes] = await Promise.all([
            adminSupabase
                .from('orders')
                .select('id, folio, ordered_at, order_status, payment_status, total_with_vat, balance_amount, utm_source')
                .eq('customer_id', customer.id)
                .order('ordered_at', { ascending: false }),
            adminSupabase
                .from('customer_identities')
                .select('id, type, value_norm, is_primary, verified_at')
                .eq('customer_id', customer.id)
                .order('is_primary', { ascending: false }),
            adminSupabase
                .from('leads')
                .select('utm_source, utm_campaign, created_at')
                .eq('customer_id', customer.id)
                .order('created_at', { ascending: true }),
        ]);

        if (ordersRes.error) {
            reportError(ordersRes.error, { action: 'getCustomerById', phase: 'orders' });
        }
        if (identitiesRes.error) {
            reportError(identitiesRes.error, { action: 'getCustomerById', phase: 'identities' });
        }
        if (leadsRes.error) {
            reportError(leadsRes.error, { action: 'getCustomerById', phase: 'leads' });
        }

        const orders = (ordersRes.data || []) as Array<Pick<Database['public']['Tables']['orders']['Row'], 'id' | 'folio' | 'ordered_at' | 'order_status' | 'payment_status' | 'total_with_vat' | 'balance_amount'>>;
        const validOrders = orders.filter((order) => order.order_status !== 'cancelled');

        const ltv = validOrders
            .filter((order) => order.order_status !== 'draft')
            .reduce((acc, order) => acc + Number(order.total_with_vat || 0), 0);
        const paid = validOrders.reduce((acc, order) => acc + (Number(order.total_with_vat || 0) - Number(order.balance_amount || 0)), 0);
        const pending = validOrders.reduce((acc, order) => acc + Number(order.balance_amount || 0), 0);
        const openStatuses: Array<Database['public']['Tables']['orders']['Row']['order_status']> = ['draft', 'confirmed', 'scheduled', 'in_progress'];
        const openCount = validOrders.filter((order) => openStatuses.includes(order.order_status)).length;

        const leadRows = (leadsRes.data || []) as Array<{ utm_source: string | null; utm_campaign: string | null; created_at: string }>;
        const sourceCounter = new Map<string, number>();
        const campaignCounter = new Map<string, number>();
        for (const lead of leadRows) {
            if (lead.utm_source) sourceCounter.set(lead.utm_source, (sourceCounter.get(lead.utm_source) || 0) + 1);
            if (lead.utm_campaign) campaignCounter.set(lead.utm_campaign, (campaignCounter.get(lead.utm_campaign) || 0) + 1);
        }

        const topSource = [...sourceCounter.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
        const topCampaign = [...campaignCounter.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
        const firstTouchAt = leadRows[0]?.created_at || null;
        const lastTouchAt = leadRows.length > 0 ? leadRows[leadRows.length - 1]?.created_at || null : null;

        const detail: CustomerDetail = {
            id: customer.id,
            display_name: customer.display_name,
            primary_phone_norm: customer.primary_phone_norm,
            primary_email_norm: customer.primary_email_norm,
            identity_status: customer.identity_status,
            created_at: customer.created_at,
            updated_at: customer.updated_at,
            orders_total: validOrders.length,
            ltv_mxn: ltv,
            active_open_orders: openCount,
            average_order_value_mxn: validOrders.length ? ltv / validOrders.length : 0,
            paid_mxn: paid,
            pending_mxn: pending,
            legacy_notes: customer.legacy_notes || null,
            rfc: customer.rfc || null,
            billing_enabled: customer.billing_enabled || false,
            billing_regimen: customer.billing_regimen || null,
            cfdi_use: customer.cfdi_use || null,
            postal_code: customer.postal_code || null,
            last_order_date: normalizeDateBounds(validOrders[0]?.ordered_at || null),
            attribution: {
                top_source: topSource,
                top_campaign: topCampaign,
                first_touch_at: normalizeDateBounds(firstTouchAt),
                last_touch_at: normalizeDateBounds(lastTouchAt),
            },
            orders: orders.map((order) => ({
                id: order.id,
                folio: order.folio,
                ordered_at: order.ordered_at,
                order_status: order.order_status,
                payment_status: order.payment_status,
                total_with_vat: Number(order.total_with_vat || 0),
                balance_amount: Number(order.balance_amount || 0),
            })),
            identities: ((identitiesRes.data || []) as Array<Database['public']['Tables']['customer_identities']['Row']>).map((identity) => ({
                id: identity.id,
                type: identity.type,
                value_norm: identity.value_norm,
                is_primary: identity.is_primary,
                verified_at: identity.verified_at,
            })),
        };

        return { success: true, data: detail };
    } catch (error) {
        reportError(error, { action: 'getCustomerById', phase: 'unexpected' });
        return { success: false, error: 'Error inesperado al consultar el cliente' };
    }
}

