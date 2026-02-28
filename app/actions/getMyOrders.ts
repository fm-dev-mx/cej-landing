'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { reportError } from '@/lib/monitoring';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';

export interface OrderSummary {
    id: string;
    folio: string;
    status: string;
    total_amount: number;
    currency: string;
    items: Array<{
        id: string;
        label: string;
        volume?: number;
    }>;
    created_at: string;
    delivery_date: string | null;
}

export interface GetMyOrdersResult {
    success: boolean;
    orders: OrderSummary[];
    nextCursor?: string | null;
    error?: string;
}

/**
 * Fetches orders for the currently authenticated user with cursor-based pagination.
 * Uses RLS to ensure users can only see their own orders.
 *
 * @param cursor - The 'created_at' timestamp of the last item from the previous page.
 * @param pageSize - Number of items to fetch (default: 25).
 */
export async function getMyOrders(cursor?: string, pageSize = 25): Promise<GetMyOrdersResult> {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return {
                success: false,
                orders: [],
                error: 'Usuario no autenticado',
            };
        }

        // RBAC Check
        const role = getUserRole(user.user_metadata);
        if (!hasPermission(role, 'orders:view')) {
            return {
                success: false,
                orders: [],
                error: 'No tienes permiso para ver esta sección',
            };
        }

        // Fetch orders - RLS ensures we only get this user's orders
        let query = supabase
            .from('orders')
            .select('id, folio, status, total_amount, currency, items, created_at, delivery_date')
            .order('created_at', { ascending: false })
            .limit(pageSize);

        if (cursor) {
            query = query.lt('created_at', cursor);
        }

        const { data: orders, error: dbError } = await query;

        if (dbError) {
            reportError(dbError, { action: 'getMyOrders', phase: 'db_query' });
            return {
                success: false,
                orders: [],
                error: 'Error al obtener los pedidos',
            };
        }

        return {
            success: true,
            orders: orders || [],
            nextCursor: (orders && orders.length === pageSize)
                ? orders[orders.length - 1].created_at
                : null,
        };
    } catch (error) {
        reportError(error, { action: 'getMyOrders', phase: 'unexpected' });
        return {
            success: false,
            orders: [],
            error: 'Error inesperado',
        };
    }
}

/**
 * Refreshes the dashboard data.
 */
export async function refreshDashboard() {
    revalidatePath('/dashboard');
}
