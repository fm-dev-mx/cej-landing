import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCustomerById } from '@/app/actions/getCustomerById';
import CustomerEditClient from './CustomerEditClient';
import styles from '../../../admin-common.module.scss';

interface CustomerEditPageProps {
    params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: 'Editar Cliente | CEJ Pro', robots: 'noindex' };

export default async function CustomerEditPage({ params }: CustomerEditPageProps) {
    const { id } = await params;
    const result = await getCustomerById(id);

    if (!result.success || !result.data) {
        notFound();
    }

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <h1>Editar Cliente: {result.data.display_name}</h1>
                <Link href={`/dashboard/customers/${id}`} className={styles.backLink}>
                    Volver al detalle
                </Link>
            </header>

            <CustomerEditClient initialData={result.data} />
        </main>
    );
}
