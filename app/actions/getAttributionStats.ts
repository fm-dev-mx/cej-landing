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
 * Aggregates orders and total sales by utm_source.
 * Restricted to admin/owner roles.
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

        // We use query instead of RPC if we want to stay within standard Supabase JS client
        // but for grouping/aggregating, SQL is better.
        // Given we don't have an RPC yet, we'll do a simple grouped select if possible,
        // or aggregate client-side if the volume is low (standard for MVP).
        // Better: use Supabase's powerful filtering or an RPC.

        const { data, error } = await supabase
            .from('orders')
            .select('utm_source, total_amount')
            .not('status', 'eq', 'cancelled');

        if (error) {
            reportError(error, { source: 'getAttributionStats' });
            return { status: 'error', message: 'Error al consultar estadísticas.' };
        }

        // Aggregate results
        const statsMap = new Map<string, { count: number; total: number }>();

        data.forEach((order) => {
            const source = order.utm_source || 'unknown';
            const current = statsMap.get(source) || { count: 0, total: 0 };
            statsMap.set(source, {
                count: current.count + 1,
                total: current.total + Number(order.total_amount),
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
