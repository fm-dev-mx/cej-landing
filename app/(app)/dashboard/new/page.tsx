// Note: This is an internal file that will be written to app/(app)/dashboard/new/page.tsx
// I will separate it into its own tool call to avoid size limits if needed,
// but for now I'll write the full component.

import { Metadata } from 'next';
import Link from 'next/link';
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
                    <Link href="/dashboard" className={styles.backLink}>
                        ← Volver al Dashboard
                    </Link>
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
