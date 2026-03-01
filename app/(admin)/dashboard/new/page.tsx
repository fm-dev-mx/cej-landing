import { Metadata } from 'next';
import { AdminOrderForm } from './AdminOrderForm';
import styles from './page.module.scss';

export const metadata: Metadata = {
    title: 'Nuevo Pedido | CEJ Pro',
    description: 'Registro manual de pedidos para administración.',
    robots: 'noindex, nofollow',
};

export default function NewOrderPage() {
    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Nuevo Pedido Manual</h1>
                    <p className={styles.subtitle}>
                        Registra una orden directamente en el sistema.
                    </p>
                </header>

                <div className={styles.formCard}>
                    <AdminOrderForm />
                </div>
            </div>
        </main>
    );
}
