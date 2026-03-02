// app/(admin)/dashboard/settings/users/page.tsx

import { Metadata } from 'next';
import { listAdminUsers } from '@/app/actions/listAdminUsers';
import { guardPage } from '@/lib/auth/requirePermission';
import commonStyles from '../../admin-common.module.scss';
import styles from './page.module.scss';
import { RoleEditor } from './RoleEditor';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
    title: 'Usuarios y Permisos | CEJ Pro',
    robots: 'noindex, nofollow',
};

export default async function UsersManagementPage() {
    // 1. Guard page access
    const session = await guardPage('admin:users');

    // 2. Fetch users
    const result = await listAdminUsers();

    if (!result.success) {
        return (
            <main className={commonStyles.main}>
                <div className={commonStyles.header}>
                    <h1>Usuarios y Permisos</h1>
                </div>
                <p className={commonStyles.errorText}>{result.error}</p>
            </main>
        );
    }

    return (
        <main className={commonStyles.main}>
            <header className={commonStyles.header}>
                <div>
                    <h2 className={commonStyles.sectionTitle}>Usuarios y Permisos</h2>
                    <p className={commonStyles.label}>
                        Administra el acceso de los miembros del equipo y asigna roles.
                    </p>
                </div>
                <Link href="/dashboard/settings" className={commonStyles.backLink}>
                    Volver a configuración
                </Link>
            </header>

            <section className={commonStyles.section}>
                <div className={commonStyles.tableContainer}>
                    <table className={commonStyles.table}>
                        <thead>
                            <tr className={commonStyles.tableHeaderRow}>
                                <th className={commonStyles.tableHeader}>Usuario</th>
                                <th className={commonStyles.tableHeader}>ID / Email</th>
                                <th className={commonStyles.tableHeader}>Rol Actual</th>
                                <th className={commonStyles.tableHeader}>Acciones</th>
                                <th className={commonStyles.tableHeader}>Creado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.users.map((user) => (
                                <tr key={user.id}>
                                    <td className={commonStyles.tableCell}>
                                        <div className={styles.userInfo}>
                                            <span className={styles.name}>{user.full_name || 'Sin nombre'}</span>
                                            <span className={styles.email}>{user.email}</span>
                                        </div>
                                    </td>
                                    <td className={commonStyles.tableCell}>
                                        <code className={styles.timestamp}>{user.id}</code>
                                    </td>
                                    <td className={commonStyles.tableCell}>
                                        <span className={`${styles.badge} ${styles[user.role]}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className={commonStyles.tableCell}>
                                        <RoleEditor
                                            userId={user.id}
                                            initialRole={user.role}
                                            currentUserId={session.user.id}
                                        />
                                    </td>
                                    <td className={commonStyles.tableCell}>
                                        <span className={styles.timestamp}>
                                            {new Date(user.created_at).toLocaleDateString('es-MX')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
