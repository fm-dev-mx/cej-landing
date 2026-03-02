'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/requirePermission';
import { reportError } from '@/lib/monitoring';
import type { CustomerListQuery, CustomerListResult, CustomerSummary } from '@/types/internal/customer';
import type { Database } from '@/types/database';

const EMPTY_RESULT: Omit<CustomerListResult, 'success'> = {
    customers: [],
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
};

function clampInt(value: number | undefined, fallback: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(min, Math.min(max, Math.trunc(value as number)));
}

function toCustomerSummary(
    customer: Database['public']['Tables']['customers']['Row'],
    orders: Array<Pick<Database['public']['Tables']['orders']['Row'], 'order_status' | 'total_with_vat' | 'ordered_at'>>
): CustomerSummary {
    const validOrders = orders.filter((order) => order.order_status !== 'cancelled');
    const ltv = validOrders
        .filter((order) => order.order_status !== 'draft')
        .reduce((acc, order) => acc + Number(order.total_with_vat || 0), 0);

    const openOrderStates: Array<Database['public']['Tables']['orders']['Row']['order_status']> = [
        'draft',
        'confirmed',
        'scheduled',
        'in_progress',
    ];

    const lastOrderDate = validOrders.length
        ? validOrders.reduce((latest, order) => (order.ordered_at > latest ? order.ordered_at : latest), validOrders[0].ordered_at)
        : null;

    return {
        id: customer.id,
        display_name: customer.display_name,
        primary_phone_norm: customer.primary_phone_norm,
        primary_email_norm: customer.primary_email_norm,
        identity_status: customer.identity_status,
        quality_tier: customer.quality_tier,
        billing_enabled: customer.billing_enabled,
        orders_total: validOrders.length,
        ltv_mxn: ltv,
        active_open_orders: validOrders.filter((order) => openOrderStates.includes(order.order_status)).length,
        last_order_date: lastOrderDate,
    };
}

export async function listCustomers(input: CustomerListQuery = {}): Promise<CustomerListResult> {
    const page = clampInt(input.page, 1, 1, 1_000_000);
    const pageSize = clampInt(input.pageSize, 20, 5, 100);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
        const session = await requirePermission('orders:view');
        if ('status' in session) return { success: false, ...EMPTY_RESULT, error: session.message };

        const adminSupabase = await createAdminClient();

        let query = adminSupabase
            .from('customers')
            .select('id, display_name, primary_phone_norm, primary_email_norm, identity_status, quality_tier, billing_enabled, merged_into_customer_id, created_at, updated_at', { count: 'exact' })
            .is('merged_into_customer_id', null)
            .order('updated_at', { ascending: false })
            .range(from, to);

        if (input.identity_status) {
            query = query.eq('identity_status', input.identity_status);
        }

        if (input.search && input.search.trim().length > 0) {
            const term = input.search.trim();
            query = query.or(`display_name.ilike.%${term}%,primary_phone_norm.ilike.%${term}%,primary_email_norm.ilike.%${term}%`);
        }

        const { data: customersData, count, error } = await query;
        if (error) {
            reportError(error, { action: 'listCustomers', phase: 'db_query' });
            return { success: false, ...EMPTY_RESULT, page, pageSize, error: 'Error al obtener clientes' };
        }

        const customers = (customersData || []) as Database['public']['Tables']['customers']['Row'][];
        if (customers.length === 0) {
            return { success: true, ...EMPTY_RESULT, page, pageSize };
        }

        const customerIds = customers.map((customer) => customer.id);
        const { data: ordersData, error: ordersError } = await adminSupabase
            .from('orders')
            .select('customer_id, order_status, total_with_vat, ordered_at')
            .in('customer_id', customerIds);

        if (ordersError) {
            reportError(ordersError, { action: 'listCustomers', phase: 'orders_aggregate' });
        }

        const ordersByCustomer = new Map<string, Array<Pick<Database['public']['Tables']['orders']['Row'], 'order_status' | 'total_with_vat' | 'ordered_at'>>>();
        for (const order of ((ordersData || []) as Array<Database['public']['Tables']['orders']['Row']>)) {
            if (!order.customer_id) continue;
            const bucket = ordersByCustomer.get(order.customer_id) || [];
            bucket.push({
                order_status: order.order_status,
                total_with_vat: order.total_with_vat,
                ordered_at: order.ordered_at,
            });
            ordersByCustomer.set(order.customer_id, bucket);
        }

        const summaries = customers.map((customer) =>
            toCustomerSummary(customer, ordersByCustomer.get(customer.id) || [])
        );

        const total = count ?? summaries.length;
        return {
            success: true,
            customers: summaries,
            page,
            pageSize,
            total,
            totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
        };
    } catch (error) {
        reportError(error, { action: 'listCustomers', phase: 'unexpected' });
        return { success: false, ...EMPTY_RESULT, page, pageSize, error: 'Error inesperado' };
    }
}

