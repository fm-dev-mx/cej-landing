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
 * getDashboardKpis
 * Fetches the Dashboard KPIs based on orders using the canonical schema.
 */
export async function getDashboardKpis(period: KpiPeriodType = 'current_month'): Promise<GetDashboardKpisResult> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Usuario no autenticado' };
        }

        const role = getUserRole(user.user_metadata);
        if (!hasPermission(role, 'orders:view') && !hasPermission(role, 'admin:all')) {
            return { success: false, error: 'Sin permisos' };
        }

        // Base query - uses canonical fields: order_status, total_with_vat, scheduled_date
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase as any).from('orders').select('order_status, total_with_vat, scheduled_date, ordered_at');

        const now = new Date();
        if (period === 'current_month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            query = query.gte('ordered_at', startOfMonth);
        } else if (period === 'current_week') {
            const startOfWeek = new Date();
            startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Adjust to Monday
            startOfWeek.setHours(0, 0, 0, 0);
            query = query.gte('ordered_at', startOfWeek.toISOString());
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const order of (orders || []) as any[]) {
            kpis.totalOrders += 1;

            if (['draft', 'confirmed'].includes(order.order_status)) {
                kpis.pendingOrders += 1;
            }

            if (order.order_status === 'scheduled' && order.scheduled_date === todayStr) {
                kpis.scheduledToday += 1;
            }

            if (order.order_status !== 'cancelled') {
                kpis.revenueTotal += Number(order.total_with_vat || 0);
            }
        }

        return { success: true, data: kpis };
    } catch (error) {
        reportError(error, { action: 'getDashboardKpis' });
        return { success: false, error: 'Error inesperado' };
    }
}
