import type { Metadata } from 'next';
import Link from 'next/link';
import { listOperationsWorkItems } from '@/app/actions/listOperationsWorkItems';
import styles from '../admin-common.module.scss';
import type { OperationsStage } from '@/types/internal/operations';

export const metadata: Metadata = {
    title: 'Flujo Operativo | CEJ Pro',
    robots: 'noindex',
};

interface OperationsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function withQuery(source: Record<string, string | undefined>, patch: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...source, ...patch })) {
        if (value) params.set(key, value);
    }
    return `/dashboard/operations?${params.toString()}`;
}

function labelForStage(stage: OperationsStage): string {
    if (stage === 'new_lead') return 'Nuevo lead';
    if (stage === 'qualified') return 'Calificado';
    if (stage === 'draft_order') return 'Pedido borrador';
    if (stage === 'confirmed') return 'Confirmado';
    if (stage === 'completed') return 'Completado';
    return 'Cancelado';
}

export default async function OperationsPage({ searchParams }: OperationsPageProps) {
    const params = await searchParams;
    const stage = typeof params.stage === 'string' ? params.stage : undefined;
    const search = typeof params.search === 'string' ? params.search : undefined;
    const page = Number(typeof params.page === 'string' ? params.page : '1') || 1;
    const pageSize = Number(typeof params.pageSize === 'string' ? params.pageSize : '20') || 20;

    const result = await listOperationsWorkItems({
        stage: stage as '' | OperationsStage | undefined,
        search,
        page,
        pageSize,
    });

    const queryState = {
        stage,
        search,
        pageSize: String(pageSize),
    };

    return (
        <main className={styles.main}>
            <h1 className={styles.sectionTitle}>Flujo operativo unificado</h1>

            <form className={styles.form}>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label htmlFor="search" className={styles.label}>Buscar</label>
                        <input id="search" name="search" className={styles.input} defaultValue={search} placeholder="Folio, nombre, teléfono o fuente" />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="stage" className={styles.label}>Etapa</label>
                        <select id="stage" name="stage" className={styles.input} defaultValue={stage || ''}>
                            <option value="">Todas</option>
                            <option value="new_lead">Nuevo lead</option>
                            <option value="qualified">Calificado</option>
                            <option value="draft_order">Pedido borrador</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="completed">Completado</option>
                            <option value="cancelled">Cancelado</option>
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
                            <th className={styles.tableHeader}>Tipo</th>
                            <th className={styles.tableHeader}>Etapa</th>
                            <th className={styles.tableHeader}>Registro</th>
                            <th className={styles.tableHeader}>Fuente</th>
                            <th className={styles.tableHeader}>Monto</th>
                            <th className={styles.tableHeader}>Creado</th>
                            <th className={styles.tableHeader}>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(result.items || []).map((item) => (
                            <tr key={`${item.item_type}-${item.item_id}`}>
                                <td className={styles.tableCell}>{item.item_type === 'order' ? 'Pedido' : 'Lead'}</td>
                                <td className={styles.tableCell}>{labelForStage(item.stage)}</td>
                                <td className={styles.tableCell}>{item.display_name}</td>
                                <td className={styles.tableCell}>{item.source || 'direct'}</td>
                                <td className={styles.tableCell}>
                                    {item.amount_mxn == null ? '-' : `$${item.amount_mxn.toLocaleString('es-MX')}`}
                                </td>
                                <td className={styles.tableCell}>{new Date(item.created_at).toLocaleString('es-MX')}</td>
                                <td className={styles.tableCell}>
                                    {item.order_id ? (
                                        <Link href={`/dashboard/orders/${item.order_id}`} className={styles.backLink}>Ver pedido</Link>
                                    ) : (
                                        <Link href={`/dashboard/leads?search=${item.item_id}`} className={styles.backLink}>Ver lead</Link>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {result.items.length === 0 && (
                            <tr>
                                <td colSpan={7} className={styles.emptyCell}>No hay registros para los filtros seleccionados.</td>
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
