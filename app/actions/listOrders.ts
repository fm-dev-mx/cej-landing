'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/requirePermission';
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
        const session = await requirePermission('orders:view');
        if ('status' in session) return { success: false, orders: [], error: session.message };

        const supabase = await createClient();

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
