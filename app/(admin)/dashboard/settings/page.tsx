import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './page.module.scss';

export const metadata: Metadata = {
    title: 'Configuración General | CEJ Pro',
    description: 'Gestiona módulos y parámetros generales del panel administrativo.',
    robots: 'noindex, nofollow',
};

export default function DashboardSettingsPage() {
    return (
        <main className={styles.main}>
            <section className={styles.header}>
                <h1 className={styles.title}>Configuración general</h1>
                <p className={styles.subtitle}>
                    Centraliza los parámetros clave del panel administrativo.
                </p>
            </section>

            <section className={styles.grid} aria-label="Módulos de configuración">
                <article className={styles.card}>
                    <h2 className={styles.cardTitle}>Editor de precios</h2>
                    <p className={styles.cardText}>
                        Actualiza reglas de negocio, tarifas base y aditivos.
                    </p>
                    <Link href="/dashboard/settings/pricing" className={styles.cardLink}>
                        Abrir módulo
                    </Link>
                </article>

                <article className={styles.card}>
                    <h2 className={styles.cardTitle}>Catálogos operativos</h2>
                    <p className={styles.cardText}>
                        Administra productos, proveedores, activos y empleados para las operaciones.
                    </p>
                    <Link href="/dashboard/catalogs" className={styles.cardLink}>
                        Abrir módulo
                    </Link>
                </article>

                <article className={`${styles.card} ${styles.cardDisabled}`}>
                    <h2 className={styles.cardTitle}>Integraciones y alertas</h2>
                    <p className={styles.cardText}>
                        Configuración de notificaciones internas y conectores externos.
                    </p>
                    <span
                        className={styles.badge}
                        aria-label="Módulo no disponible. Próximamente"
                        title="Próximamente"
                    >
                        Próximamente
                    </span>
                </article>
            </section>
        </main>
    );
}
