import { Metadata } from 'next';
import Link from 'next/link';
import { listOrders } from '@/app/actions/listOrders';
import styles from '../admin-common.module.scss';
export const metadata: Metadata = { title: 'Gestión de Pedidos | CEJ Pro', robots: 'noindex' };

export default async function OrdersPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const status = typeof searchParams.status === 'string' ? searchParams.status : undefined;
    const folio = typeof searchParams.folio === 'string' ? searchParams.folio : undefined;

    const { orders } = await listOrders({ status, folio });

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <h1>Gestión de Pedidos (Kanban / Lista)</h1>
                <Link href="/dashboard" className={styles.backLink}>Volver al dashboard</Link>
            </div>

            <form className={styles.form}>
                <div className={styles.formGroup}>
                    <input name="folio" placeholder="Buscar por folio..." defaultValue={folio} className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                    <select name="status" defaultValue={status || ''} className={styles.input}>
                        <option value="">Todos los estados</option>
                        <option value="draft">Borrador</option>
                        <option value="pending_payment">Pendiente de pago</option>
                        <option value="scheduled">Agendado</option>
                        <option value="delivered">Entregado</option>
                        <option value="cancelled">Cancelado</option>
                    </select>
                </div>
                <div className={styles.formGroup}>
                    <button type="submit" className={styles.button}>Filtrar</button>
                </div>
            </form>

            <table className={styles.table}>
                <thead>
                    <tr className={styles.tableHeaderRow}>
                        <th className={styles.tableHeader}>Folio</th>
                        <th className={styles.tableHeader}>Fecha Entrega</th>
                        <th className={styles.tableHeader}>Monto</th>
                        <th className={styles.tableHeader}>Estado Actual</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(o => (
                        <tr key={o.id}>
                            <td className={styles.tableCell}>{o.folio}</td>
                            <td className={styles.tableCell}>
                                {o.delivery_date ? new Date(o.delivery_date).toLocaleDateString('es-MX') : 'N/A'}
                            </td>
                            <td className={styles.tableCell}>${o.total_amount} {o.currency}</td>
                            <td className={styles.tableCell}>{o.status}</td>
                        </tr>
                    ))}
                    {orders.length === 0 && (
                        <tr><td colSpan={4} className={styles.emptyCell}>No hay pedidos</td></tr>
                    )}
                </tbody>
            </table>
        </main>
    );
}
