import { Metadata } from 'next';
import { AdminOrderForm } from './AdminOrderForm';
import styles from './page.module.scss';

export const metadata: Metadata = {
    title: 'Nuevo Pedido | CEJ Pro',
    description: 'Registro manual de pedidos para administración.',
    robots: 'noindex, nofollow',
};

interface NewOrderPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NewOrderPage({ searchParams }: NewOrderPageProps) {
    const params = await searchParams;
    const initialName = typeof params.name === 'string' ? params.name : '';
    const initialPhone = typeof params.phone === 'string' ? params.phone : '';
    const initialLeadId = typeof params.leadId === 'string' ? params.leadId : undefined;
    const initialDeliveryAddress = typeof params.deliveryAddress === 'string' ? params.deliveryAddress : '';

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h2 className={styles.title}>Nuevo pedido manual</h2>
                    <p className={styles.subtitle}>
                        Registra una orden directamente en el sistema.
                    </p>
                    <p className={styles.subtitle}>
                        El módulo de Prospectos ahora vive en <strong>Clientes</strong>.
                    </p>
                </header>

                <div className={styles.formCard}>
                    <AdminOrderForm
                        initialName={initialName}
                        initialPhone={initialPhone}
                        initialLeadId={initialLeadId}
                        initialDeliveryAddress={initialDeliveryAddress}
                    />
                </div>
            </div>
        </main>
    );
}
