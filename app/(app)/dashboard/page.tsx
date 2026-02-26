import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getMyOrders } from '@/app/actions/getMyOrders';
import { OrdersList } from './OrdersList';
import styles from './page.module.scss';

export const metadata: Metadata = {
    title: 'Mis Pedidos | CEJ Pro',
    description: 'Consulta tu historial de pedidos y realiza nuevas órdenes.',
    robots: 'noindex, nofollow',
};

export default async function DashboardPage() {
    const supabase = await createClient();
    // User is guaranteed to exist via dashboard/layout.tsx auth boundary
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch user's orders
    const { orders, success, error } = await getMyOrders();

    // Get user name for greeting
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Hola, {userName} 👋</h1>
                    <p className={styles.subtitle}>
                        Aquí puedes ver tu historial de cotizaciones y pedidos.
                    </p>
                </header>

                {!success && error && (
                    <div className={styles.errorBanner}>
                        {error}
                    </div>
                )}

                <section className={styles.ordersSection}>
                    <h2 className={styles.sectionTitle}>Mis Pedidos</h2>

                    {orders.length === 0 ? (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>📋</span>
                            <p className={styles.emptyMessage}>
                                Aún no tienes pedidos registrados.
                            </p>
                            <Link href="/" className={styles.ctaButton}>
                                Crear mi primera cotización
                            </Link>
                        </div>
                    ) : (
                        <OrdersList orders={orders} />
                    )}
                </section>
            </div>
        </main>
    );
}
