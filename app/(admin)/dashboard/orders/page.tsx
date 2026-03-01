import { Metadata } from 'next';
import Link from 'next/link';
import { listAdminOrders } from '@/app/actions/listAdminOrders';
import styles from '../admin-common.module.scss';
import type { AdminOrderSortBy, OrderStageFilter, SortDir } from '@/types/internal/order-admin';
import type { DbOrderStatus, DbPaymentStatus } from '@/types/database-enums';

export const metadata: Metadata = { title: 'Gestión de Pedidos | CEJ Pro', robots: 'noindex' };

interface OrdersPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const SORTABLE_COLUMNS: Array<{ key: AdminOrderSortBy; label: string }> = [
    { key: 'ordered_at', label: 'Fecha de pedido' },
    { key: 'scheduled_date', label: 'Entrega' },
    { key: 'total_with_vat', label: 'Monto Total' },
    { key: 'balance_amount', label: 'Saldo' },
    { key: 'order_status', label: 'Estado' },
    { key: 'payment_status', label: 'Pago' },
];

function parseNum(value: string | undefined, fallback: number): number {
    if (!value) return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return parsed;
}

function withQuery(
    source: Record<string, string | undefined>,
    patch: Record<string, string | undefined>
): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...source, ...patch })) {
        if (value) params.set(key, value);
    }
    return `/dashboard/orders?${params.toString()}`;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
    const params = await searchParams;
    const status = (typeof params.status === 'string' ? params.status : undefined) as DbOrderStatus | '' | undefined;
    const payment_status = (typeof params.payment_status === 'string' ? params.payment_status : undefined) as DbPaymentStatus | '' | undefined;
    const folio = typeof params.folio === 'string' ? params.folio : undefined;
    const dateFrom = typeof params.dateFrom === 'string' ? params.dateFrom : undefined;
    const dateTo = typeof params.dateTo === 'string' ? params.dateTo : undefined;
    const sellerId = typeof params.sellerId === 'string' ? params.sellerId : undefined;
    const stage = (typeof params.stage === 'string' ? params.stage : undefined) as OrderStageFilter | undefined;
    const search = typeof params.search === 'string' ? params.search : undefined;
    const sortBy = (typeof params.sortBy === 'string' ? params.sortBy : 'ordered_at') as AdminOrderSortBy;
    const sortDir = (typeof params.sortDir === 'string' ? params.sortDir : 'desc') as SortDir;
    const page = parseNum(typeof params.page === 'string' ? params.page : undefined, 1);
    const pageSize = parseNum(typeof params.pageSize === 'string' ? params.pageSize : undefined, 20);

    const filters = {
        status,
        payment_status,
        folio,
        dateFrom,
        dateTo,
        sellerId,
        stage,
        search,
        sortBy,
        sortDir,
    };

    const listResult = await listAdminOrders({
        ...filters,
        page,
        pageSize,
    });

    const queryState = {
        ...filters,
        pageSize: String(pageSize),
    };

    return (
        <main className={styles.main}>
            <h2 className={styles.sectionTitle}>Filtros de pedidos</h2>
            <form className={styles.form}>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label htmlFor="folio" className={styles.label}>Folio</label>
                        <input id="folio" name="folio" placeholder="Buscar por folio..." defaultValue={folio} className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="search" className={styles.label}>Búsqueda rápida</label>
                        <input id="search" name="search" placeholder="Folio o referencia..." defaultValue={search} className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="stage" className={styles.label}>Etapa</label>
                        <select id="stage" name="stage" defaultValue={stage || ''} className={styles.input}>
                            <option value="">Todas</option>
                            <option value="draft_order">Pedido borrador</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="completed">Completado</option>
                            <option value="cancelled">Cancelado</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="status" className={styles.label}>Estado del pedido</label>
                        <select id="status" name="status" defaultValue={status || ''} className={styles.input}>
                            <option value="">Todos</option>
                            <option value="draft">Borrador</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="scheduled">Agendado</option>
                            <option value="in_progress">En Progreso</option>
                            <option value="completed">Completado</option>
                            <option value="cancelled">Cancelado</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="payment_status" className={styles.label}>Estado de pago</label>
                        <select id="payment_status" name="payment_status" defaultValue={payment_status || ''} className={styles.input}>
                            <option value="">Todos</option>
                            <option value="pending">Pendiente</option>
                            <option value="partial">Parcial</option>
                            <option value="paid">Pagado</option>
                            <option value="overpaid">Excedente</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="dateFrom" className={styles.label}>Fecha entrega desde</label>
                        <input id="dateFrom" type="date" name="dateFrom" defaultValue={dateFrom} className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="dateTo" className={styles.label}>Fecha entrega hasta</label>
                        <input id="dateTo" type="date" name="dateTo" defaultValue={dateTo} className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="pageSize" className={styles.label}>Resultados por página</label>
                        <select id="pageSize" name="pageSize" defaultValue={String(pageSize)} className={styles.input}>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
                    </div>
                </div>
                <input type="hidden" name="sortBy" value={sortBy} />
                <input type="hidden" name="sortDir" value={sortDir} />
                <input type="hidden" name="page" value="1" />
                <div className={styles.formActions}>
                    <button type="submit" className={styles.button}>Aplicar filtros</button>
                </div>
            </form>

            {!listResult.success && (
                <p className={styles.errorText} role="alert">{listResult.error}</p>
            )}

            <h2 className={styles.sectionTitle}>Listado de pedidos</h2>
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.tableHeaderRow}>
                            <th className={styles.tableHeader}>Folio</th>
                            <th className={styles.tableHeader}>Etapa</th>
                            {SORTABLE_COLUMNS.map((column) => {
                                const nextDir: SortDir = (sortBy === column.key && sortDir === 'asc') ? 'desc' : 'asc';
                                const href = withQuery(queryState, {
                                    sortBy: column.key,
                                    sortDir: nextDir,
                                    page: '1',
                                });
                                const isActive = sortBy === column.key;
                                return (
                                    <th key={column.key} className={styles.tableHeader}>
                                        <Link href={href} className={styles.backLink}>
                                            {column.label} {isActive ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                                        </Link>
                                    </th>
                                );
                            })}
                            <th className={styles.tableHeader}>Cliente</th>
                            <th className={styles.tableHeader}>Fuente</th>
                            <th className={styles.tableHeader}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {listResult.orders.map((o) => (
                            <tr key={o.id}>
                                <td className={styles.tableCell}>{o.folio}</td>
                                <td className={styles.tableCell}>{o.stage}</td>
                                <td className={styles.tableCell}>{new Date(o.ordered_at).toLocaleDateString('es-MX', { timeZone: 'UTC' })}</td>
                                <td className={styles.tableCell}>
                                    {o.scheduled_date ? new Date(o.scheduled_date).toLocaleDateString('es-MX', { timeZone: 'UTC' }) : 'Pendiente'}
                                </td>
                                <td className={styles.tableCell}>${o.total_with_vat.toLocaleString('es-MX')}</td>
                                <td className={styles.tableCell}>${o.balance_amount.toLocaleString('es-MX')}</td>
                                <td className={styles.tableCell}>{o.order_status}</td>
                                <td className={styles.tableCell}>{o.payment_status}</td>
                                <td className={styles.tableCell}>{o.customer_name || 'Sin vincular'}</td>
                                <td className={styles.tableCell}>{o.source || 'direct'}</td>
                                <td className={styles.tableCell}>
                                    <Link href={`/dashboard/orders/${o.id}`} className={styles.backLink}>
                                        Ver detalle
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {listResult.orders.length === 0 && (
                            <tr><td colSpan={11} className={styles.emptyCell}>No hay pedidos encontrados</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {listResult.totalPages > 1 && (
                <div className={styles.formActions}>
                    <Link
                        href={withQuery(queryState, { page: String(Math.max(1, page - 1)) })}
                        className={styles.backLink}
                    >
                        Página anterior
                    </Link>
                    <span className={styles.label}>
                        Página {page} de {listResult.totalPages}
                    </span>
                    <Link
                        href={withQuery(queryState, { page: String(Math.min(listResult.totalPages, page + 1)) })}
                        className={styles.backLink}
                    >
                        Página siguiente
                    </Link>
                </div>
            )}
        </main>
    );
}
