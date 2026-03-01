'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminSidebar.module.scss';

interface AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface NavItem {
    href: string;
    label: string;
    disabled?: boolean;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
    {
        title: 'Overview',
        items: [
            { href: '/dashboard', label: 'Dashboard / KPIs' },
        ],
    },
    {
        title: 'Operations',
        items: [
            { href: '/dashboard/orders', label: 'Pedidos' },
            { href: '/dashboard/new', label: 'Leads' },
        ],
    },
    {
        title: 'Financials',
        items: [
            { href: '/dashboard/expenses', label: 'Gastos' },
            { href: '/dashboard/payroll', label: 'Nómina' },
        ],
    },
    {
        title: 'Configuration',
        items: [
            { href: '/dashboard/settings/pricing', label: 'Editor de precios' },
            { href: '/dashboard/settings', label: 'Configuración general', disabled: true },
        ],
    },
    {
        title: 'Reports',
        items: [
            { href: '/dashboard/reports', label: 'Analítica y exportaciones' },
            { href: '/dashboard/calendar', label: 'Calendario de despachos' },
        ],
    },
];

function isRouteActive(pathname: string, href: string): boolean {
    if (href === '/dashboard') {
        return pathname === '/dashboard';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
    const pathname = usePathname();

    return (
        <aside
            className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
            aria-label="Navegación del panel administrativo"
        >
            <div className={styles.brand}>
                <p className={styles.brandEyebrow}>CEJ Pro</p>
                <p className={styles.brandTitle}>Panel Admin</p>
            </div>

            <nav className={styles.nav}>
                {NAV_GROUPS.map((group) => (
                    <section key={group.title} className={styles.group}>
                        <h2 className={styles.groupTitle}>{group.title}</h2>
                        <ul className={styles.groupList}>
                            {group.items.map((item) => {
                                const active = !item.disabled && isRouteActive(pathname, item.href);

                                if (item.disabled) {
                                    return (
                                        <li key={item.href}>
                                            <span
                                                className={`${styles.link} ${styles.disabled}`}
                                                aria-disabled="true"
                                            >
                                                {item.label}
                                            </span>
                                        </li>
                                    );
                                }

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={`${styles.link} ${active ? styles.active : ''}`}
                                            aria-current={active ? 'page' : undefined}
                                            onClick={onClose}
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                ))}
            </nav>
        </aside>
    );
}
