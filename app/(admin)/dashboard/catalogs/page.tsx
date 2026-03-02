import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '../admin-common.module.scss';

export const metadata: Metadata = {
    title: 'Catálogos | CEJ Pro',
    robots: 'noindex',
};

export default function CatalogsHubPage() {
    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <h1>Catálogos operativos</h1>
                <Link href="/dashboard/settings" className={styles.backLink}>Volver a configuración</Link>
            </header>

            <section className={styles.section}>
                <div className={styles.formGrid}>
                    <Link href="/dashboard/catalogs/products" className={styles.button}>Productos</Link>
                    <Link href="/dashboard/catalogs/vendors" className={styles.button}>Proveedores</Link>
                    <Link href="/dashboard/catalogs/assets" className={styles.button}>Activos</Link>
                    <Link href="/dashboard/catalogs/employees" className={styles.button}>Empleados</Link>
                </div>
            </section>
        </main>
    );
}
