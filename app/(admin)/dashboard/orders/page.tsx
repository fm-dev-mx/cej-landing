import { Metadata } from 'next';
import { listOrders } from '@/app/actions/listOrders';
import styles from '../admin-common.module.scss';

export const metadata: Metadata = { title: 'Gestión de Pedidos | CEJ Pro', robots: 'noindex' };

interface OrdersPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
    // Next.js 15+ requirement: await searchParams
    const params = await searchParams;
    const status = typeof params.status === 'string' ? params.status : undefined;
    const folio = typeof params.folio === 'string' ? params.folio : undefined;

    const { orders } = await listOrders({ status, folio });

    return (
        <main className={styles.main}>
            <h2 className={styles.sectionTitle}>Filtros de pedidos</h2>
            <form className={styles.form}>
                <div className={styles.formGroup}>
                    <input name="folio" placeholder="Buscar por folio..." defaultValue={folio} className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                    <select name="status" defaultValue={status || ''} className={styles.input}>
                        <option value="">Todos los estados</option>
                        <option value="draft">Borrador</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="scheduled">Agendado</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="completed">Completado</option>
                        <option value="cancelled">Cancelado</option>
                    </select>
                </div>
                <div className={styles.formGroup}>
                    <button type="submit" className={styles.button}>Filtrar</button>
                </div>
            </form>

            <h2 className={styles.sectionTitle}>Listado de pedidos</h2>
            <table className={styles.table}>
                <thead>
                    <tr className={styles.tableHeaderRow}>
                        <th className={styles.tableHeader}>Folio</th>
                        <th className={styles.tableHeader}>Monto Total</th>
                        <th className={styles.tableHeader}>Saldo</th>
                        <th className={styles.tableHeader}>Estado</th>
                        <th className={styles.tableHeader}>Pago</th>
                        <th className={styles.tableHeader}>Entrega</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(o => (
                        <tr key={o.id}>
                            <td className={styles.tableCell}>{o.folio}</td>
                            <td className={styles.tableCell}>${o.total_with_vat.toLocaleString('es-MX')}</td>
                            <td className={styles.tableCell}>${o.balance_amount.toLocaleString('es-MX')}</td>
                            <td className={styles.tableCell}>{o.order_status}</td>
                            <td className={styles.tableCell}>{o.payment_status}</td>
                            <td className={styles.tableCell}>
                                {o.scheduled_date ? new Date(o.scheduled_date).toLocaleDateString('es-MX', { timeZone: 'UTC' }) : 'Pendiente'}
                            </td>
                        </tr>
                    ))}
                    {orders.length === 0 && (
                        <tr><td colSpan={6} className={styles.emptyCell}>No hay pedidos encontrados</td></tr>
                    )}
                </tbody>
            </table>
        </main>
    );
}
