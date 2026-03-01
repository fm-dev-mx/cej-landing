import type { Metadata } from 'next';
import { listLeads } from '@/app/actions/listLeads';
import styles from '../admin-common.module.scss';

export const metadata: Metadata = {
    title: 'Leads | CEJ Pro',
    robots: 'noindex',
};

interface LeadsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
    const params = await searchParams;
    const status = typeof params.status === 'string' ? params.status : undefined;
    const search = typeof params.search === 'string' ? params.search : undefined;
    const page = Number(typeof params.page === 'string' ? params.page : '1') || 1;
    const pageSize = Number(typeof params.pageSize === 'string' ? params.pageSize : '20') || 20;

    const result = await listLeads({
        status: status as '' | 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'archived' | undefined,
        search,
        page,
        pageSize,
    });

    return (
        <main className={styles.main}>
            <h1 className={styles.sectionTitle}>Inbox de leads</h1>

            <form className={styles.form}>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label htmlFor="search" className={styles.label}>Buscar</label>
                        <input id="search" name="search" className={styles.input} defaultValue={search} placeholder="Nombre o teléfono" />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="status" className={styles.label}>Estado</label>
                        <select id="status" name="status" className={styles.input} defaultValue={status || ''}>
                            <option value="">Todos</option>
                            <option value="new">new</option>
                            <option value="contacted">contacted</option>
                            <option value="qualified">qualified</option>
                            <option value="converted">converted</option>
                            <option value="lost">lost</option>
                            <option value="archived">archived</option>
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
                    <button type="submit" className={styles.button}>Aplicar filtros</button>
                </div>
            </form>

            {!result.success && (
                <p className={styles.errorText} role="alert">{result.error}</p>
            )}

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.tableHeaderRow}>
                            <th className={styles.tableHeader}>ID</th>
                            <th className={styles.tableHeader}>Nombre</th>
                            <th className={styles.tableHeader}>Teléfono</th>
                            <th className={styles.tableHeader}>Estado</th>
                            <th className={styles.tableHeader}>Fuente</th>
                            <th className={styles.tableHeader}>Campaña</th>
                            <th className={styles.tableHeader}>Customer</th>
                            <th className={styles.tableHeader}>Creado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(result.leads || []).map((lead) => (
                            <tr key={lead.id}>
                                <td className={styles.tableCell}>{lead.id}</td>
                                <td className={styles.tableCell}>{lead.name}</td>
                                <td className={styles.tableCell}>{lead.phone}</td>
                                <td className={styles.tableCell}>{lead.status}</td>
                                <td className={styles.tableCell}>{lead.utm_source || 'direct'}</td>
                                <td className={styles.tableCell}>{lead.utm_campaign || '-'}</td>
                                <td className={styles.tableCell}>{lead.customer_id || 'Sin vincular'}</td>
                                <td className={styles.tableCell}>{new Date(lead.created_at).toLocaleString('es-MX')}</td>
                            </tr>
                        ))}
                        {result.leads.length === 0 && (
                            <tr>
                                <td colSpan={8} className={styles.emptyCell}>No hay leads para los filtros seleccionados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
