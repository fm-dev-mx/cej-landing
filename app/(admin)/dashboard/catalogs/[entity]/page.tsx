import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listAssets, listEmployees, listProducts, listVendors } from '@/app/actions/catalogCrud';
import styles from '../../admin-common.module.scss';
import { CATALOG_ENTITY_LABELS, isCatalogEntity } from './entity-config';

interface CatalogEntityPageProps {
    params: Promise<{ entity: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: CatalogEntityPageProps): Promise<Metadata> {
    const { entity } = await params;
    if (!isCatalogEntity(entity)) return { title: 'Catálogo | CEJ Pro', robots: 'noindex' };
    return { title: `${CATALOG_ENTITY_LABELS[entity].title} | CEJ Pro`, robots: 'noindex' };
}

export default async function CatalogEntityPage({ params, searchParams }: CatalogEntityPageProps) {
    const { entity } = await params;
    if (!isCatalogEntity(entity)) notFound();

    const query = await searchParams;
    const search = typeof query.search === 'string' ? query.search : undefined;
    const status = typeof query.status === 'string' ? query.status : undefined;

    const result = entity === 'products'
        ? await listProducts({ search, status })
        : entity === 'vendors'
            ? await listVendors({ search })
            : entity === 'assets'
                ? await listAssets({ search, status })
                : await listEmployees({ search, status });

    const label = CATALOG_ENTITY_LABELS[entity];

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <h1>{label.title}</h1>
                <Link href={`/dashboard/catalogs/${entity}/new`} className={styles.button}>+ Nuevo {label.singular}</Link>
            </header>

            <form className={styles.form}>
                <div className={styles.formGrid}>
                    <label className={styles.formGroup}>
                        Buscar
                        <input className={styles.input} name="search" defaultValue={search} placeholder={`Buscar ${label.singular}...`} />
                    </label>
                    {(entity === 'products' || entity === 'assets' || entity === 'employees') && (
                        <label className={styles.formGroup}>
                            Estado
                            <select className={styles.input} name="status" defaultValue={status || ''}>
                                <option value="">Todos</option>
                                <option value="active">Activos</option>
                                <option value="inactive">Inactivos</option>
                            </select>
                        </label>
                    )}
                </div>
                <div className={styles.formActions}>
                    <button type="submit" className={styles.button}>Aplicar</button>
                </div>
            </form>

            {!result.success && <p className={styles.errorText} role="alert">{result.error}</p>}

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.tableHeaderRow}>
                            {entity === 'products' && (
                                <>
                                    <th className={styles.tableHeader}>SKU</th>
                                    <th className={styles.tableHeader}>Nombre</th>
                                    <th className={styles.tableHeader}>Categoría</th>
                                    <th className={styles.tableHeader}>Precio</th>
                                    <th className={styles.tableHeader}>Estado</th>
                                </>
                            )}
                            {entity === 'vendors' && (
                                <>
                                    <th className={styles.tableHeader}>Nombre</th>
                                    <th className={styles.tableHeader}>RFC / Tax ID</th>
                                    <th className={styles.tableHeader}>Notas</th>
                                </>
                            )}
                            {entity === 'assets' && (
                                <>
                                    <th className={styles.tableHeader}>Código</th>
                                    <th className={styles.tableHeader}>Etiqueta</th>
                                    <th className={styles.tableHeader}>Tipo</th>
                                    <th className={styles.tableHeader}>Activo</th>
                                </>
                            )}
                            {entity === 'employees' && (
                                <>
                                    <th className={styles.tableHeader}>Nombre</th>
                                    <th className={styles.tableHeader}>Estatus</th>
                                    <th className={styles.tableHeader}>Alta</th>
                                    <th className={styles.tableHeader}>Baja</th>
                                </>
                            )}
                            <th className={styles.tableHeader}>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.items.map((item) => {
                            const id = entity === 'products' ? String((item as { sku: string }).sku) : String((item as { id: string }).id);
                            return (
                                <tr key={id}>
                                    {entity === 'products' && (
                                        <>
                                            <td className={styles.tableCell}>{(item as { sku: string }).sku}</td>
                                            <td className={styles.tableCell}>{(item as { name: string }).name}</td>
                                            <td className={styles.tableCell}>{(item as { category: string }).category}</td>
                                            <td className={styles.tableCell}>${Number((item as { client_price_mxn: number | null }).client_price_mxn || 0).toLocaleString('es-MX')}</td>
                                            <td className={styles.tableCell}>{(item as { status: string }).status}</td>
                                        </>
                                    )}
                                    {entity === 'vendors' && (
                                        <>
                                            <td className={styles.tableCell}>{(item as { name: string }).name}</td>
                                            <td className={styles.tableCell}>{(item as { tax_id: string | null }).tax_id || '-'}</td>
                                            <td className={styles.tableCell}>{(item as { notes: string | null }).notes || '-'}</td>
                                        </>
                                    )}
                                    {entity === 'assets' && (
                                        <>
                                            <td className={styles.tableCell}>{(item as { code: string }).code}</td>
                                            <td className={styles.tableCell}>{(item as { label: string | null }).label || '-'}</td>
                                            <td className={styles.tableCell}>{(item as { asset_type: string }).asset_type}</td>
                                            <td className={styles.tableCell}>{(item as { active: boolean }).active ? 'Sí' : 'No'}</td>
                                        </>
                                    )}
                                    {entity === 'employees' && (
                                        <>
                                            <td className={styles.tableCell}>{(item as { full_name: string }).full_name}</td>
                                            <td className={styles.tableCell}>{(item as { status: string }).status}</td>
                                            <td className={styles.tableCell}>{(item as { hired_at: string | null }).hired_at || '-'}</td>
                                            <td className={styles.tableCell}>{(item as { left_at: string | null }).left_at || '-'}</td>
                                        </>
                                    )}
                                    <td className={styles.tableCell}>
                                        <Link href={`/dashboard/catalogs/${entity}/${id}`} className={styles.backLink}>Editar</Link>
                                    </td>
                                </tr>
                            );
                        })}
                        {result.items.length === 0 && (
                            <tr>
                                <td className={styles.emptyCell} colSpan={6}>No hay registros de {label.title.toLowerCase()}.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
