import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAdminOrderById } from '@/app/actions/getAdminOrderById';
import OrderDetailClient from './OrderDetailClient';
import styles from '../../admin-common.module.scss';

interface OrderDetailPageProps {
    params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: 'Detalle de Pedido | CEJ Pro', robots: 'noindex' };

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
    const { id } = await params;
    const result = await getAdminOrderById(id);

    if (!result.success || !result.data) {
        notFound();
    }

    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <h1>Pedido {result.data.order.folio}</h1>
                <Link href="/dashboard/orders" className={styles.backLink}>
                    Volver al listado
                </Link>
            </header>

            <OrderDetailClient initialData={result.data} />
        </main>
    );
}
