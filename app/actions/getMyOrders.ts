'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { reportError } from '@/lib/monitoring';

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
    error?: string;
}

/**
 * Fetches all orders for the currently authenticated user.
 * Uses RLS to ensure users can only see their own orders.
 */
export async function getMyOrders(): Promise<GetMyOrdersResult> {
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

        // Fetch orders - RLS ensures we only get this user's orders
        const { data: orders, error: dbError } = await supabase
            .from('orders')
            .select('id, folio, status, total_amount, currency, items, created_at, delivery_date')
            .order('created_at', { ascending: false });

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
