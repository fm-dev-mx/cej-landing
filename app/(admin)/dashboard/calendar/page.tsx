import { Metadata } from 'next';
import Link from 'next/link';
import { listOrders } from '@/app/actions/listOrders';
import styles from './page.module.scss';
import type { OrderSummary } from '@/app/actions/getMyOrders';

export const metadata: Metadata = {
    title: 'Calendario de Despachos | CEJ Pro',
    description: 'Vista de calendario de pedidos agendados.',
    robots: 'noindex, nofollow',
};

// Componente para una columna del calendario que procesa agrupamiento
function DayColumn({ date, label, orders }: { date: string, label: string, orders: OrderSummary[] }) {
    const dayOrders = orders.filter(o => o.delivery_date && o.delivery_date.startsWith(date));

    return (
        <div className={styles.dayColumn}>
            <h3 className={styles.dayTitle}>{label}</h3>
            {dayOrders.length === 0 ? (
                <div className={styles.emptySlot}>Sin entregas programadas</div>
            ) : (
                dayOrders.map(order => {
                    const totalVol = order.items.reduce((acc, it) => acc + (it.volume || 0), 0);
                    const time = new Date(order.delivery_date as string).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

                    return (
                        <Link key={order.id} href={`/dashboard/orders?folio=${order.folio}`} className={styles.orderCard}>
                            <div className={styles.orderFolio}>{order.folio}</div>
                            <div className={styles.orderDetail}>
                                <span>{time}</span>
                                <span>{totalVol > 0 ? `${totalVol} m³` : 'Sin vol'}</span>
                            </div>
                            <span className={styles.statusBadge}>{order.status}</span>
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
    // Monday as start (simple assumption for MVP, ideally we use a library like date-fns)
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));

    // Calculate next 7 days
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return {
            dateStr: d.toISOString().split('T')[0],
            label: d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }),
        };
    });

    const startDate = weekDays[0].dateStr;
    const endDate = weekDays[6].dateStr + 'T23:59:59.999Z';

    const { orders } = await listOrders({ startDate, endDate });

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Calendario de Despachos</h1>
                </header>

                <div className={styles.calendarGrid}>
                    {weekDays.map(d => (
                        <DayColumn key={d.dateStr} date={d.dateStr} label={d.label} orders={orders} />
                    ))}
                </div>
            </div>
        </main>
    );
}
