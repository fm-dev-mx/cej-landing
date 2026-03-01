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
            .select('id, folio, status, total_amount, currency, items, created_at, delivery_date')
            .order('delivery_date', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: false });

        if (filters.status) {
            query = query.eq('status', filters.status);
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

        const { data, error } = await query;

        if (error) {
            reportError(error, { action: 'listOrders', phase: 'db_query' });
            return { success: false, orders: [], error: 'Error al obtener los pedidos' };
        }

        // Add explicit type casting for returned rows
        const mappedOrders: OrderSummary[] = (data || []).map((order: unknown) => {
            const o = order as Record<string, unknown>;
            return {
                id: String(o.id),
                folio: String(o.folio),
                status: String(o.status),
                total_amount: Number(o.total_amount || 0),
                currency: String(o.currency || 'MXN'),
                items: Array.isArray(o.items) ? (o.items as OrderSummary['items']) : [],
                created_at: String(o.created_at),
                delivery_date: o.delivery_date ? String(o.delivery_date) : null,
            };
        });

        return { success: true, orders: mappedOrders };
    } catch (error) {
        reportError(error, { action: 'listOrders', phase: 'unexpected' });
        return { success: false, orders: [], error: 'Error inesperado' };
    }
}
