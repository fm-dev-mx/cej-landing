import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCustomerById } from '@/app/actions/getCustomerById';
import styles from '../../admin-common.module.scss';

export const metadata: Metadata = {
    title: 'Detalle de Cliente | CEJ Pro',
    robots: 'noindex',
};

interface CustomerDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
    const { id } = await params;
    const result = await getCustomerById(id);

    if (!result.success || !result.data) {
        notFound();
    }

    const customer = result.data;

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <div className={styles.formGroup}>
                    <h1>Cliente: {customer.display_name}</h1>
                    <Link href="/dashboard/customers" className={styles.backLink}>Volver al listado</Link>
                </div>
                <Link href={`/dashboard/customers/${customer.id}/edit`} className={styles.button}>Editar Cliente</Link>
            </header>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Resumen</h2>
                <div className={styles.formGrid}>
                    <p><strong>Identidad:</strong> {customer.identity_status}</p>
                    <p><strong>Teléfono:</strong> {customer.primary_phone_norm || '-'}</p>
                    <p><strong>Email:</strong> {customer.primary_email_norm || '-'}</p>
                    <p><strong>Creado:</strong> {new Date(customer.created_at).toLocaleString('es-MX')}</p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Agregados financieros</h2>
                <div className={styles.formGrid}>
                    <p><strong>Pedidos:</strong> {customer.orders_total}</p>
                    <p><strong>LTV:</strong> ${customer.ltv_mxn.toLocaleString('es-MX')}</p>
                    <p><strong>Abiertos:</strong> {customer.active_open_orders}</p>
                    <p><strong>Ticket promedio:</strong> ${customer.average_order_value_mxn.toLocaleString('es-MX')}</p>
                    <p><strong>Pagado:</strong> ${customer.paid_mxn.toLocaleString('es-MX')}</p>
                    <p><strong>Pendiente:</strong> ${customer.pending_mxn.toLocaleString('es-MX')}</p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Snapshot de atribución</h2>
                <div className={styles.formGrid}>
                    <p><strong>Fuente principal:</strong> {customer.attribution.top_source || 'direct'}</p>
                    <p><strong>Campaña principal:</strong> {customer.attribution.top_campaign || '-'}</p>
                    <p><strong>Primer touch:</strong> {customer.attribution.first_touch_at ? new Date(customer.attribution.first_touch_at).toLocaleString('es-MX') : '-'}</p>
                    <p><strong>Último touch:</strong> {customer.attribution.last_touch_at ? new Date(customer.attribution.last_touch_at).toLocaleString('es-MX') : '-'}</p>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Información de contacto</h2>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.tableHeaderRow}>
                                <th className={styles.tableHeader}>Tipo</th>
                                <th className={styles.tableHeader}>Valor</th>
                                <th className={styles.tableHeader}>Principal</th>
                                <th className={styles.tableHeader}>Verificado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customer.identities.map((identity) => (
                                <tr key={identity.id}>
                                    <td className={styles.tableCell}>{identity.type}</td>
                                    <td className={styles.tableCell}>{identity.value_norm}</td>
                                    <td className={styles.tableCell}>{identity.is_primary ? 'Sí' : 'No'}</td>
                                    <td className={styles.tableCell}>{identity.verified_at ? new Date(identity.verified_at).toLocaleString('es-MX') : 'No'}</td>
                                </tr>
                            ))}
                            {customer.identities.length === 0 && (
                                <tr><td colSpan={4} className={styles.emptyCell}>Sin identidades registradas.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Historial de pedidos</h2>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.tableHeaderRow}>
                                <th className={styles.tableHeader}>Folio</th>
                                <th className={styles.tableHeader}>Fecha</th>
                                <th className={styles.tableHeader}>Estado</th>
                                <th className={styles.tableHeader}>Pago</th>
                                <th className={styles.tableHeader}>Total</th>
                                <th className={styles.tableHeader}>Saldo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customer.orders.map((order) => (
                                <tr key={order.id}>
                                    <td className={styles.tableCell}>
                                        <Link href={`/dashboard/orders/${order.id}`} className={styles.backLink}>{order.folio}</Link>
                                    </td>
                                    <td className={styles.tableCell}>{new Date(order.ordered_at).toLocaleString('es-MX')}</td>
                                    <td className={styles.tableCell}>{order.order_status}</td>
                                    <td className={styles.tableCell}>{order.payment_status}</td>
                                    <td className={styles.tableCell}>${order.total_with_vat.toLocaleString('es-MX')}</td>
                                    <td className={styles.tableCell}>${order.balance_amount.toLocaleString('es-MX')}</td>
                                </tr>
                            ))}
                            {customer.orders.length === 0 && (
                                <tr><td colSpan={6} className={styles.emptyCell}>Sin pedidos asociados.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
