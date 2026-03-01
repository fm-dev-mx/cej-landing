export type KpiPeriodType = 'current_month' | 'current_week' | 'all_time';

export interface DashboardKpis {
    totalOrders: number;
    scheduledToday: number;
    pendingOrders: number;
    revenueTotal: number;
    currency: string;
}
