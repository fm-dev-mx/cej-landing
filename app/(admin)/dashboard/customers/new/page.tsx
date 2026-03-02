import type { Metadata } from 'next';
import Link from 'next/link';
import CustomerForm from './CustomerForm';
import styles from '../../admin-common.module.scss';

export const metadata: Metadata = {
    title: 'Nuevo Cliente | CEJ Pro',
    robots: 'noindex',
};

interface NewCustomerPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NewCustomerPage({ searchParams }: NewCustomerPageProps) {
    const params = await searchParams;
    const name = typeof params.name === 'string' ? params.name : '';
    const phone = typeof params.phone === 'string' ? params.phone : '';

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <h1>Registrar Nuevo Cliente</h1>
                <Link href="/dashboard/customers" className={styles.backLink}>
                    Volver al listado
                </Link>
            </header>

            <section className={styles.section}>
                <CustomerForm initialName={name} initialPhone={phone} />
            </section>
        </main>
    );
}
