import { Metadata } from 'next';
import { getPriceConfig } from '@/app/actions/getPriceConfig';
import { PricingEditor } from './PricingEditor';
import styles from './PricingManagement.module.scss';

export const metadata: Metadata = {
    title: 'Gestión de Precios | CEJ Pro',
    description: 'Configura las reglas de negocio, precios base y aditivos.',
    robots: 'noindex, nofollow',
};

export default async function PricingManagementPage() {
    const pricingRules = await getPriceConfig();

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1>Gestión de Precios</h1>
                <p className={styles.versionBadge}>Versión Actual: {pricingRules.version}</p>
            </header>

            <PricingEditor initialRules={pricingRules} />
        </main>
    );
}
