import { Metadata } from 'next';
import Link from 'next/link';
import { listOrders } from '@/app/actions/listOrders';
import styles from './page.module.scss';
import type { OrderSummary } from '@/types/internal/order';

export const metadata: Metadata = {
    title: 'Calendario de Despachos | CEJ Pro',
    description: 'Vista de calendario de pedidos agendados.',
    robots: 'noindex, nofollow',
};

interface DayColumnProps {
    date: string;
    label: string;
    orders: OrderSummary[];
}

// Componente para una columna del calendario que procesa agrupamiento
function DayColumn({ date, label, orders }: DayColumnProps) {
    const dayOrders = orders.filter(o => o.scheduled_date && o.scheduled_date.startsWith(date));

    return (
        <div className={styles.dayColumn}>
            <h3 className={styles.dayTitle}>{label}</h3>
            {dayOrders.length === 0 ? (
                <div className={styles.emptySlot}>Sin entregas programadas</div>
            ) : (
                dayOrders.map(order => {
                    const time = order.ordered_at ? new Date(order.ordered_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '00:00';

                    return (
                        <Link key={order.id} href={`/dashboard/orders?folio=${order.folio}`} className={styles.orderCard}>
                            <div className={styles.orderFolio}>{order.folio}</div>
                            <div className={styles.orderDetail}>
                                <span>{time}</span>
                                <span>{order.quantity_m3} m³</span>
                            </div>
                            <span className={styles.statusBadge} data-status={order.order_status}>
                                {order.order_status}
                            </span>
                        </Link>
                    );
                })
            )}
        </div>
    );
}

export default async function CalendarPage() {
    // Current week baseline
    const now = new Date();
    // Monday as start
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.getFullYear(), now.getMonth(), diff);

    // Calculate next 7 days
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        // Format as YYYY-MM-DD for local date matching
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const date = String(d.getDate()).padStart(2, '0');
        return {
            dateStr: `${year}-${month}-${date}`,
            label: d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }),
        };
    });

    const startDate = weekDays[0].dateStr;
    const endDate = weekDays[6].dateStr;

    const { orders } = await listOrders({ startDate, endDate });

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <p className={styles.title}>Programación semanal de despachos</p>

                <div className={styles.calendarGrid}>
                    {weekDays.map(d => (
                        <DayColumn key={d.dateStr} date={d.dateStr} label={d.label} orders={orders} />
                    ))}
                </div>
            </div>
        </main>
    );
}
