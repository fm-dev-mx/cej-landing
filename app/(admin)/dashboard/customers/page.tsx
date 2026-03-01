import type { Metadata } from 'next';
import Link from 'next/link';
import { listCustomers } from '@/app/actions/listCustomers';
import styles from '../admin-common.module.scss';

export const metadata: Metadata = {
    title: 'Clientes | CEJ Pro',
    robots: 'noindex',
};

interface CustomersPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function withQuery(source: Record<string, string | undefined>, patch: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...source, ...patch })) {
        if (value) params.set(key, value);
    }
    return `/dashboard/customers?${params.toString()}`;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
    const params = await searchParams;
    const search = typeof params.search === 'string' ? params.search : undefined;
    const identityStatus = typeof params.identity_status === 'string' ? params.identity_status : undefined;
    const page = Number(typeof params.page === 'string' ? params.page : '1') || 1;
    const pageSize = Number(typeof params.pageSize === 'string' ? params.pageSize : '20') || 20;

    const result = await listCustomers({
        search,
        page,
        pageSize,
        identity_status: identityStatus as '' | 'unverified' | 'verified' | 'merged' | undefined,
    });

    const queryState = {
        search,
        identity_status: identityStatus,
        pageSize: String(pageSize),
    };

    return (
        <main className={styles.main}>
            <h1 className={styles.sectionTitle}>Clientes</h1>

            <form className={styles.form}>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label htmlFor="search" className={styles.label}>Buscar</label>
                        <input id="search" name="search" className={styles.input} defaultValue={search} placeholder="Nombre, teléfono o email" />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="identity_status" className={styles.label}>Estado de identidad</label>
                        <select id="identity_status" name="identity_status" className={styles.input} defaultValue={identityStatus || ''}>
                            <option value="">Todos</option>
                            <option value="unverified">No verificado</option>
                            <option value="verified">Verificado</option>
                            <option value="merged">Fusionado</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="pageSize" className={styles.label}>Resultados</label>
                        <select id="pageSize" name="pageSize" className={styles.input} defaultValue={String(pageSize)}>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>
                <input type="hidden" name="page" value="1" />
                <div className={styles.formActions}>
                    <button type="submit" className={styles.button}>Aplicar</button>
                </div>
            </form>

            {!result.success && (
                <p className={styles.errorText} role="alert">{result.error}</p>
            )}

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.tableHeaderRow}>
                            <th className={styles.tableHeader}>Nombre</th>
                            <th className={styles.tableHeader}>Teléfono</th>
                            <th className={styles.tableHeader}>Email</th>
                            <th className={styles.tableHeader}>Pedidos</th>
                            <th className={styles.tableHeader}>LTV</th>
                            <th className={styles.tableHeader}>Abiertos</th>
                            <th className={styles.tableHeader}>Último pedido</th>
                            <th className={styles.tableHeader}>Identidad</th>
                            <th className={styles.tableHeader}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(result.customers || []).map((customer) => (
                            <tr key={customer.id}>
                                <td className={styles.tableCell}>{customer.display_name}</td>
                                <td className={styles.tableCell}>{customer.primary_phone_norm || '-'}</td>
                                <td className={styles.tableCell}>{customer.primary_email_norm || '-'}</td>
                                <td className={styles.tableCell}>{customer.orders_total}</td>
                                <td className={styles.tableCell}>${customer.ltv_mxn.toLocaleString('es-MX')}</td>
                                <td className={styles.tableCell}>{customer.active_open_orders}</td>
                                <td className={styles.tableCell}>
                                    {customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString('es-MX') : 'Sin pedidos'}
                                </td>
                                <td className={styles.tableCell}>{customer.identity_status}</td>
                                <td className={styles.tableCell}>
                                    <Link href={`/dashboard/customers/${customer.id}`} className={styles.backLink}>
                                        Ver detalle
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {result.customers.length === 0 && (
                            <tr>
                                <td colSpan={9} className={styles.emptyCell}>No hay clientes para los filtros seleccionados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {result.totalPages > 1 && (
                <div className={styles.formActions}>
                    <Link href={withQuery(queryState, { page: String(Math.max(1, page - 1)) })} className={styles.backLink}>
                        Página anterior
                    </Link>
                    <span className={styles.label}>Página {page} de {result.totalPages}</span>
                    <Link href={withQuery(queryState, { page: String(Math.min(result.totalPages, page + 1)) })} className={styles.backLink}>
                        Página siguiente
                    </Link>
                </div>
            )}
        </main>
    );
}

