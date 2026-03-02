'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { reportError } from '@/lib/monitoring';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import { orderListQuerySchema } from '@/lib/schemas/internal/order-admin';
import type { AdminOrderSortBy, OrderListQuery, OrderListResult } from '@/types/internal/order-admin';
import type { Database } from '@/types/database';

const SORT_COLUMN_MAP: Record<AdminOrderSortBy, keyof Database['public']['Tables']['orders']['Row']> = {
    ordered_at: 'ordered_at',
    scheduled_date: 'scheduled_date',
    total_with_vat: 'total_with_vat',
    balance_amount: 'balance_amount',
    order_status: 'order_status',
    payment_status: 'payment_status',
};

const EMPTY_PAGINATION = { orders: [], page: 1, pageSize: 20, total: 0, totalPages: 0 };

export async function listAdminOrders(input: OrderListQuery = {}): Promise<OrderListResult> {
    try {
        const parsed = orderListQuerySchema.safeParse(input);
        if (!parsed.success) {
            return {
                success: false,
                ...EMPTY_PAGINATION,
                error: 'Parámetros de búsqueda inválidos',
            };
        }

        const params = parsed.data;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, ...EMPTY_PAGINATION, error: 'Usuario no autenticado' };
        }

        const role = getUserRole(user.user_metadata);
        if (!hasPermission(role, 'orders:view') && !hasPermission(role, 'admin:all')) {
            return { success: false, ...EMPTY_PAGINATION, error: 'No tienes permiso para ver esta sección' };
        }

        const adminSupabase = await createAdminClient();
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;

        let query = adminSupabase
            .from('orders')
            .select('id, folio, order_status, payment_status, total_with_vat, balance_amount, quantity_m3, ordered_at, scheduled_date, scheduled_slot_code, seller_id, customer_id, utm_source', { count: 'exact' })
            .range(from, to);

        const sortColumn = SORT_COLUMN_MAP[params.sortBy];
        query = query.order(sortColumn, { ascending: params.sortDir === 'asc', nullsFirst: params.sortDir === 'asc' });
        if (params.sortBy !== 'ordered_at') {
            query = query.order('ordered_at', { ascending: false });
        }

        if (params.status) query = query.eq('order_status', params.status);
        if (params.payment_status) query = query.eq('payment_status', params.payment_status);
        if (params.folio) query = query.ilike('folio', `%${params.folio}%`);
        if (params.dateFrom) query = query.gte('scheduled_date', params.dateFrom);
        if (params.dateTo) query = query.lte('scheduled_date', params.dateTo);
        if (params.sellerId) query = query.eq('seller_id', params.sellerId);
        if (params.search) {
            const term = params.search.trim();
            query = query.or(`folio.ilike.%${term}%,external_ref.ilike.%${term}%`);
        }
        if (params.stage === 'draft_order') {
            query = query.eq('order_status', 'draft');
        } else if (params.stage === 'confirmed') {
            query = query.in('order_status', ['confirmed', 'scheduled', 'in_progress']);
        } else if (params.stage === 'completed') {
            query = query.eq('order_status', 'completed');
        } else if (params.stage === 'cancelled') {
            query = query.eq('order_status', 'cancelled');
        }

        const { data, count, error } = await query;
        if (error) {
            reportError(error, { action: 'listAdminOrders', phase: 'db_query' });
            return {
                success: false,
                orders: [],
                page: params.page,
                pageSize: params.pageSize,
                total: 0,
                totalPages: 0,
                error: 'Error al obtener pedidos',
            };
        }

        const total = count ?? 0;
        const totalPages = total === 0 ? 0 : Math.ceil(total / params.pageSize);
        const typedRows = (data || []) as Array<{
            id: string;
            folio: string;
            customer_id: string | null;
            utm_source: string | null;
            order_status: Database['public']['Tables']['orders']['Row']['order_status'];
            payment_status: Database['public']['Tables']['orders']['Row']['payment_status'];
            total_with_vat: number | null;
            balance_amount: number | null;
            quantity_m3: number | null;
            ordered_at: string;
            scheduled_date: string | null;
            scheduled_slot_code: string | null;
            seller_id: string | null;
        }>;

        const customerIds = Array.from(new Set(typedRows.map((order) => order.customer_id).filter(Boolean))) as string[];
        let customerNames = new Map<string, string>();
        if (customerIds.length > 0) {
            const { data: customersData, error: customerError } = await adminSupabase
                .from('customers')
                .select('id, display_name')
                .in('id', customerIds);
            if (customerError) {
                reportError(customerError, { action: 'listAdminOrders', phase: 'customer_lookup' });
            } else {
                customerNames = new Map(
                    ((customersData || []) as Array<{ id: string; display_name: string }>).map((customer) => [customer.id, customer.display_name])
                );
            }
        }

        return {
            success: true,
            orders: typedRows.map((order) => ({
                id: order.id,
                folio: order.folio,
                customer_id: order.customer_id,
                customer_name: order.customer_id ? (customerNames.get(order.customer_id) || null) : null,
                source: order.utm_source,
                stage:
                    order.order_status === 'draft'
                        ? 'draft_order'
                        : order.order_status === 'completed'
                            ? 'completed'
                            : order.order_status === 'cancelled'
                                ? 'cancelled'
                                : 'confirmed',
                order_status: order.order_status,
                payment_status: order.payment_status,
                total_with_vat: Number(order.total_with_vat || 0),
                balance_amount: Number(order.balance_amount || 0),
                quantity_m3: Number(order.quantity_m3 || 0),
                ordered_at: order.ordered_at,
                scheduled_date: order.scheduled_date,
                scheduled_slot_code: order.scheduled_slot_code,
                seller_id: order.seller_id,
            })),
            page: params.page,
            pageSize: params.pageSize,
            total,
            totalPages,
        };
    } catch (error) {
        reportError(error, { action: 'listAdminOrders', phase: 'unexpected' });
        return {
            success: false,
            ...EMPTY_PAGINATION,
            error: 'Error inesperado',
        };
    }
}
