import type { Metadata } from 'next';
import Link from 'next/link';
import CustomerForm from './CustomerForm';
import styles from '../../admin-common.module.scss';

export const metadata: Metadata = {
    title: 'Nuevo Cliente | CEJ Pro',
    robots: 'noindex',
};

export default function NewCustomerPage() {
    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <h1>Registrar Nuevo Cliente</h1>
                <Link href="/dashboard/customers" className={styles.backLink}>
                    Volver al listado
                </Link>
            </header>

            <section className={styles.section}>
                <CustomerForm />
            </section>
        </main>
    );
}
