import type { Metadata } from 'next';
import Link from 'next/link';
import LeadForm from './LeadForm';
import styles from '../../admin-common.module.scss';

export const metadata: Metadata = {
    title: 'Nuevo Lead | CEJ Pro',
    robots: 'noindex',
};

export default function NewLeadPage() {
    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <h1>Registrar Nuevo Lead Manual</h1>
                <Link href="/dashboard/leads" className={styles.backLink}>
                    Volver al listado
                </Link>
            </header>

            <section className={styles.section}>
                <LeadForm />
            </section>
        </main>
    );
}
