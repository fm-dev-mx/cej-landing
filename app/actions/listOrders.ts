'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import { reportError } from '@/lib/monitoring';
import type { OrderSummary } from './getMyOrders';

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

export async function listOrders(filters: ListOrdersFilters = {}): Promise<ListOrdersResult> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, orders: [], error: 'Usuario no autenticado' };
        }

        const role = getUserRole(user.user_metadata);
        if (!hasPermission(role, 'orders:view')) {
            return { success: false, orders: [], error: 'No tienes permiso para ver esta sección' };
        }

        let query = supabase
            .from('orders')
            .select('id, folio, status, order_status, total_amount, total_with_vat, currency, items, created_at, ordered_at, delivery_date, scheduled_date, payment_status, balance_amount')
            .order('delivery_date', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: false });

        if (filters.status) {
            query = query.or(`status.eq.${filters.status},order_status.eq.${filters.status}`);
        }
        if (filters.startDate) {
            query = query.gte('delivery_date', filters.startDate);
        }
        if (filters.endDate) {
            query = query.lte('delivery_date', filters.endDate); // .lte is <=
        }
        if (filters.folio) {
            query = query.ilike('folio', `%${filters.folio}%`);
        }

        const firstResult = await query;
        let data: Array<Record<string, unknown>> | null = (firstResult.data as Array<Record<string, unknown>> | null);
        let error = firstResult.error;

        if (error && /column|schema cache|order_status|scheduled_date|payment_status/i.test(error.message)) {
            let legacyQuery = supabase
                .from('orders')
                .select('id, folio, status, total_amount, currency, items, created_at, delivery_date')
                .order('delivery_date', { ascending: true, nullsFirst: false })
                .order('created_at', { ascending: false });

            if (filters.status) {
                legacyQuery = legacyQuery.eq('status', filters.status);
            }
            if (filters.startDate) {
                legacyQuery = legacyQuery.gte('delivery_date', filters.startDate);
            }
            if (filters.endDate) {
                legacyQuery = legacyQuery.lte('delivery_date', filters.endDate);
            }
            if (filters.folio) {
                legacyQuery = legacyQuery.ilike('folio', `%${filters.folio}%`);
            }

            const legacyResult = await legacyQuery;
            data = legacyResult.data as Array<Record<string, unknown>> | null;
            error = legacyResult.error;
        }

        if (error) {
            reportError(error, { action: 'listOrders', phase: 'db_query' });
            return { success: false, orders: [], error: 'Error al obtener los pedidos' };
        }

        // Add explicit type casting for returned rows
        const mappedOrders: OrderSummary[] = (data || []).map((order: unknown) => {
            const o = order as Record<string, unknown>;
            const normalizedStatus = String(o.order_status || o.status || 'draft');
            return {
                id: String(o.id),
                folio: String(o.folio),
                status: normalizedStatus,
                total_amount: Number(o.total_with_vat || o.total_amount || 0),
                currency: String(o.currency || 'MXN'),
                items: Array.isArray(o.items) ? (o.items as OrderSummary['items']) : [],
                created_at: String(o.ordered_at || o.created_at),
                delivery_date: o.scheduled_date
                    ? String(o.scheduled_date)
                    : (o.delivery_date ? String(o.delivery_date) : null),
            };
        });

        return { success: true, orders: mappedOrders };
    } catch (error) {
        reportError(error, { action: 'listOrders', phase: 'unexpected' });
        return { success: false, orders: [], error: 'Error inesperado' };
    }
}
