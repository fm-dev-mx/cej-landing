import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAssetById, getEmployeeById, getProductById, getVendorById } from '@/app/actions/catalogCrud';
import CatalogEntityForm from '../CatalogEntityForm';
import styles from '../../../admin-common.module.scss';
import { CATALOG_ENTITY_LABELS, isCatalogEntity } from '../entity-config';

interface CatalogEntityDetailPageProps {
    params: Promise<{ entity: string; id: string }>;
}

export async function generateMetadata({ params }: CatalogEntityDetailPageProps): Promise<Metadata> {
    const { entity } = await params;
    if (!isCatalogEntity(entity)) return { title: 'Editar catálogo | CEJ Pro', robots: 'noindex' };
    return { title: `Editar ${CATALOG_ENTITY_LABELS[entity].singular} | CEJ Pro`, robots: 'noindex' };
}

export default async function CatalogEntityDetailPage({ params }: CatalogEntityDetailPageProps) {
    const { entity, id } = await params;
    if (!isCatalogEntity(entity)) notFound();

    const result = entity === 'products'
        ? await getProductById(id)
        : entity === 'vendors'
            ? await getVendorById(id)
            : entity === 'assets'
                ? await getAssetById(id)
                : await getEmployeeById(id);

    if (!result.success || !result.data) notFound();

    const label = CATALOG_ENTITY_LABELS[entity];

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <h1>Editar {label.singular}</h1>
                <Link href={`/dashboard/catalogs/${entity}`} className={styles.backLink}>Volver al listado</Link>
            </header>

            <CatalogEntityForm entity={entity} initialData={result.data as unknown as Record<string, unknown>} recordId={id} />
        </main>
    );
}
