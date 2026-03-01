'use client';
// Utility: route highlighting helpers

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
    available: boolean;
    comingSoonLabel?: string;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
    {
        title: 'Operación',
        items: [
            { href: '/dashboard/operations', label: 'Flujo', available: true },
            { href: '/dashboard/orders', label: 'Pedidos', available: true },
            { href: '/dashboard/customers', label: 'Clientes', available: true },
            { href: '/dashboard/leads', label: 'Leads', available: true },
            { href: '/dashboard/new', label: 'Nuevo pedido', available: true },
        ],
    },
    {
        title: 'Análisis',
        items: [
            { href: '/dashboard', label: 'Dashboard y KPIs', available: true },
            { href: '/dashboard/reports', label: 'Reportes', available: true },
            { href: '/dashboard/calendar', label: 'Calendario', available: true },
        ],
    },
    {
        title: 'Finanzas',
        items: [
            { href: '/dashboard/expenses', label: 'Gastos', available: true },
            { href: '/dashboard/payroll', label: 'Nómina', available: true },
        ],
    },
    {
        title: 'Configuración',
        items: [
            { href: '/dashboard/settings', label: 'Configuración general', available: true },
            { href: '/dashboard/settings/pricing', label: 'Editor de precios', available: true },
            { href: '/dashboard/settings/users', label: 'Usuarios y permisos', available: false, comingSoonLabel: 'Próximamente' },
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
                <p className={styles.brandTitle}>Panel administrativo</p>
            </div>

            <nav className={styles.nav}>
                {NAV_GROUPS.map((group) => (
                    <section key={group.title} className={styles.group}>
                        <h2 className={styles.groupTitle}>{group.title}</h2>
                        <ul className={styles.groupList}>
                            {group.items.map((item) => {
                                const active = item.available && isRouteActive(pathname, item.href);

                                if (!item.available) {
                                    return (
                                        <li key={item.href}>
                                            <span
                                                className={`${styles.link} ${styles.disabled} ${styles.comingSoon}`}
                                                aria-disabled="true"
                                                title={item.comingSoonLabel || 'Próximamente'}
                                            >
                                                {item.label}
                                                <span className={styles.comingSoonBadge}>
                                                    {item.comingSoonLabel || 'Próximamente'}
                                                </span>
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
