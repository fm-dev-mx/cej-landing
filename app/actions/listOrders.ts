'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import { reportError } from '@/lib/monitoring';
import type { OrderSummary } from '@/types/internal/order';
import type { DbOrderStatus, DbPaymentStatus } from '@/types/database-enums';

export interface ListOrdersFilters {
    status?: string;
    startDate?: string;
    endDate?: string;
    folio?: string;
}

export interface ListOrdersResult {
    success: boolean;
    orders: OrderSummary[];
    error?: string;
}

/**
 * listOrders
 * Admin-facing action to browse the order book.
 * - Uses Service Role to bypass strict RLS as required by dashboard.
 * - Filtered by folio, status, and dates.
 */
export async function listOrders(filters: ListOrdersFilters = {}): Promise<ListOrdersResult> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, orders: [], error: 'Usuario no autenticado' };
        }

        const role = getUserRole(user.user_metadata);
        if (!hasPermission(role, 'orders:view') && !hasPermission(role, 'admin:all')) {
            return { success: false, orders: [], error: 'No tienes permiso para ver esta sección' };
        }

        let query = supabase
            .from('orders')
            .select(`
                id,
                folio,
                order_status,
                payment_status,
                total_with_vat,
                balance_amount,
                quantity_m3,
                ordered_at,
                scheduled_date
            `)
            .order('scheduled_date', { ascending: true, nullsFirst: false })
            .order('ordered_at', { ascending: false });

        if (filters.status) {
            query = query.eq('order_status', filters.status);
        }
        if (filters.startDate) {
            query = query.gte('scheduled_date', filters.startDate);
        }
        if (filters.endDate) {
            query = query.lte('scheduled_date', filters.endDate);
        }
        if (filters.folio) {
            query = query.ilike('folio', `%${filters.folio}%`);
        }

        const { data, error } = await query;

        if (error) {
            reportError(error, { action: 'listOrders', phase: 'db_query' });
            return { success: false, orders: [], error: 'Error al obtener los pedidos' };
        }

        interface OrderRow {
            id: string;
            folio: string;
            order_status: DbOrderStatus;
            payment_status: DbPaymentStatus;
            total_with_vat: number;
            balance_amount: number;
            quantity_m3: number;
            ordered_at: string;
            scheduled_date: string | null;
        }
        const mappedOrders: OrderSummary[] = (data || []).map((o: OrderRow) => ({
            id: o.id,
            folio: o.folio,
            order_status: o.order_status,
            payment_status: o.payment_status,
            total_with_vat: Number(o.total_with_vat),
            balance_amount: Number(o.balance_amount),
            quantity_m3: Number(o.quantity_m3 || 0),
            ordered_at: o.ordered_at,
            scheduled_date: o.scheduled_date,
        }));

        return { success: true, orders: mappedOrders };
    } catch (error) {
        reportError(error, { action: 'listOrders', phase: 'unexpected' });
        return { success: false, orders: [], error: 'Error inesperado' };
    }
}
