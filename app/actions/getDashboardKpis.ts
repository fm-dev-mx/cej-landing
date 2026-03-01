'use server';

import { createClient } from '@/lib/supabase/server';
import { reportError } from '@/lib/monitoring';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import type { DashboardKpis, KpiPeriodType } from '@/types/internal/reporting';

export interface GetDashboardKpisResult {
    success: boolean;
    data?: DashboardKpis;
    error?: string;
}

/**
 * Fetches the Dashboard KPIs based on orders.
 * A more complex version would also subtract expenses and payroll.
 * For Phase 1, we pull direct totals from the orders table.
 */
export async function getDashboardKpis(period: KpiPeriodType = 'current_month'): Promise<GetDashboardKpisResult> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Usuario no autenticado' };
        }

        const role = getUserRole(user.user_metadata);
        if (!hasPermission(role, 'orders:view')) {
            return { success: false, error: 'Sin permisos' };
        }

        // Base query - RLS will restrict to the correct tenant/user internally
        let query = supabase.from('orders').select('status, total_amount, currency, delivery_date');

        // Note: For 'current_month'/week in a robust app we filter via date strings or DB functions.
        // For MVP frontend simplicity we pull orders and reduce in JS since RLS limits data size per user.
        // Or we can apply gt/lt filters.
        const now = new Date();
        if (period === 'current_month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            query = query.gte('created_at', startOfMonth);
        } else if (period === 'current_week') {
            const startOfWeek = new Date();
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            query = query.gte('created_at', startOfWeek.toISOString());
        }

        const { data: orders, error } = await query;

        if (error) {
            reportError(error, { action: 'getDashboardKpis' });
            return { success: false, error: 'Error al consultar KPIs' };
        }

        const kpis: DashboardKpis = {
            totalOrders: 0,
            scheduledToday: 0,
            pendingOrders: 0,
            revenueTotal: 0,
            currency: 'MXN'
        };

        const todayStr = now.toISOString().split('T')[0];

        for (const order of (orders || [])) {
            kpis.totalOrders += 1;

            if (['draft', 'pending_payment'].includes(order.status)) {
                kpis.pendingOrders += 1;
            }

            if (order.status === 'scheduled' && order.delivery_date && order.delivery_date.startsWith(todayStr)) {
                kpis.scheduledToday += 1;
            }

            // Simple MVP revenue: sum total amounts.
            // Ideally we exclude cancelled orders.
            if (order.status !== 'cancelled') {
                kpis.revenueTotal += Number(order.total_amount || 0);
            }
        }

        return { success: true, data: kpis };
    } catch (error) {
        reportError(error, { action: 'getDashboardKpis' });
        return { success: false, error: 'Error inesperado' };
    }
}
