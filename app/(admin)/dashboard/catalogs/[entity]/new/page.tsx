import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CatalogEntityForm from '../CatalogEntityForm';
import styles from '../../../admin-common.module.scss';
import { CATALOG_ENTITY_LABELS, isCatalogEntity } from '../entity-config';

interface NewCatalogEntityPageProps {
    params: Promise<{ entity: string }>;
}

export async function generateMetadata({ params }: NewCatalogEntityPageProps): Promise<Metadata> {
    const { entity } = await params;
    if (!isCatalogEntity(entity)) return { title: 'Nuevo catálogo | CEJ Pro', robots: 'noindex' };
    return { title: `Nuevo ${CATALOG_ENTITY_LABELS[entity].singular} | CEJ Pro`, robots: 'noindex' };
}

export default async function NewCatalogEntityPage({ params }: NewCatalogEntityPageProps) {
    const { entity } = await params;
    if (!isCatalogEntity(entity)) notFound();

    const label = CATALOG_ENTITY_LABELS[entity];

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <h1>Nuevo {label.singular}</h1>
                <Link href={`/dashboard/catalogs/${entity}`} className={styles.backLink}>Volver al listado</Link>
            </header>

            <CatalogEntityForm entity={entity} />
        </main>
    );
}
