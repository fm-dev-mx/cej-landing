'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminTopbar.module.scss';
import { UserProfileMenu } from '@/components/Auth';

interface AdminTopbarProps {
    userName: string;
    userEmail: string;
    onMenuToggle: () => void;
}

interface Breadcrumb {
    href: string;
    label: string;
}

const LABEL_MAP: Record<string, string> = {
    dashboard: 'Dashboard',
    orders: 'Pedidos',
    new: 'Leads',
    expenses: 'Gastos',
    payroll: 'Nómina',
    settings: 'Configuración',
    pricing: 'Editor de precios',
    reports: 'Reportes',
    calendar: 'Calendario',
};

function buildBreadcrumbs(pathname: string): Breadcrumb[] {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: Breadcrumb[] = [{ href: '/dashboard', label: 'Dashboard' }];

    if (segments.length <= 1) {
        return breadcrumbs;
    }

    let accumulated = '';

    for (const segment of segments.slice(1)) {
        accumulated += `/${segment}`;
        breadcrumbs.push({
            href: `/dashboard${accumulated}`,
            label: LABEL_MAP[segment] ?? segment,
        });
    }

    return breadcrumbs;
}

function getSectionTitle(pathname: string): string {
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1] ?? 'dashboard';
    return LABEL_MAP[last] ?? 'Dashboard';
}

export default function AdminTopbar({
    userName,
    userEmail,
    onMenuToggle,
}: AdminTopbarProps) {
    const pathname = usePathname();
    const breadcrumbs = buildBreadcrumbs(pathname);
    const sectionTitle = getSectionTitle(pathname);

    return (
        <header className={styles.topbar}>
            <div className={styles.leftColumn}>
                <button
                    type="button"
                    className={styles.menuButton}
                    onClick={onMenuToggle}
                    aria-label="Abrir navegación lateral"
                >
                    <span className={styles.menuIcon} aria-hidden="true">
                        ☰
                    </span>
                </button>

                <div className={styles.context}>
                    <p className={styles.title}>{sectionTitle}</p>
                    <nav aria-label="Migas de pan" className={styles.breadcrumbs}>
                        <ol className={styles.breadcrumbList}>
                            {breadcrumbs.map((item, index) => {
                                const isCurrent = index === breadcrumbs.length - 1;
                                return (
                                    <li key={item.href} className={styles.breadcrumbItem}>
                                        {isCurrent ? (
                                            <span aria-current="page">{item.label}</span>
                                        ) : (
                                            <Link href={item.href}>{item.label}</Link>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    </nav>
                </div>
            </div>

            <UserProfileMenu userName={userName} userEmail={userEmail} />
        </header>
    );
}
