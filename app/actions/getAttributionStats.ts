'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import { redirect } from 'next/navigation';
import { reportError } from '@/lib/monitoring';

export type AttributionStat = {
    utm_source: string;
    order_count: number;
    total_sales: number;
};

export type AttributionStatsResult =
    | { status: 'success'; data: AttributionStat[] }
    | { status: 'error'; message: string };

/**
 * getAttributionStats
 * Aggregates orders and total sales by utm_source using canonical schema.
 */
export async function getAttributionStats(): Promise<AttributionStatsResult> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            redirect('/login');
        }

        const role = getUserRole(user.user_metadata);
        if (!hasPermission(role, 'admin:all')) {
            return { status: 'error', message: 'No tienes permiso para ver estadísticas de atribución.' };
        }

        const { data, error } = await supabase
            .from('orders')
            .select('utm_source, total_with_vat')
            .not('order_status', 'eq', 'cancelled');

        if (error) {
            reportError(error, { source: 'getAttributionStats' });
            return { status: 'error', message: 'Error al consultar estadísticas.' };
        }

        interface OrderRow {
            utm_source: string | null;
            total_with_vat: number;
        }
        const statsMap = new Map<string, { count: number; total: number }>();

        data?.forEach((order: OrderRow) => {
            const source = order.utm_source || 'unknown';
            const current = statsMap.get(source) || { count: 0, total: 0 };
            statsMap.set(source, {
                count: current.count + 1,
                total: current.total + Number(order.total_with_vat),
            });
        });

        const stats: AttributionStat[] = Array.from(statsMap.entries()).map(([utm_source, data]) => ({
            utm_source,
            order_count: data.count,
            total_sales: data.total,
        }));

        // Sort by total sales descending
        stats.sort((a, b) => b.total_sales - a.total_sales);

        return { status: 'success', data: stats };
    } catch (err) {
        if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
            throw err;
        }
        reportError(err, { source: 'getAttributionStats' });
        return { status: 'error', message: 'Error inesperado al obtener estadísticas.' };
    }
}
