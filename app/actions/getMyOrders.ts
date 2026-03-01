'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { reportError } from '@/lib/monitoring';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import type { OrderSummary } from '@/types/internal/order';
import type { DbOrderStatus, DbPaymentStatus } from '@/types/database-enums';

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
 * @param cursor - The 'ordered_at' timestamp of the last item from the previous page.
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
            .order('ordered_at', { ascending: false })
            .limit(pageSize);

        if (cursor) {
            query = query.lt('ordered_at', cursor);
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
        const mappedOrders: OrderSummary[] = (orders || []).map((o: OrderRow) => ({
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

        return {
            success: true,
            orders: mappedOrders,
            nextCursor: (mappedOrders.length === pageSize)
                ? mappedOrders[mappedOrders.length - 1].ordered_at
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        revalidatePath('/dashboard');
    }
}
