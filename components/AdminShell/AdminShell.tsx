'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from './AdminShell.module.scss';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopbar from '@/components/AdminTopbar';

interface AdminShellProps {
    children: React.ReactNode;
    userName: string;
    userEmail: string;
    userRole: string;
}

export default function AdminShell({
    children,
    userName,
    userEmail,
    userRole,
}: AdminShellProps) {
    const [openedOnPath, setOpenedOnPath] = useState<string | null>(null);
    const pathname = usePathname();
    const isSidebarOpen = openedOnPath === pathname;

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpenedOnPath(null);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const handleCloseSidebar = () => {
        setOpenedOnPath(null);
    };

    return (
        <div className={styles.shell}>
            <AdminSidebar
                isOpen={isSidebarOpen}
                onClose={handleCloseSidebar}
            />

            {isSidebarOpen && (
                <button
                    type="button"
                    className={styles.overlay}
                    onClick={handleCloseSidebar}
                    aria-label="Cerrar menú lateral"
                />
            )}

            <div className={styles.mainColumn}>
                <AdminTopbar
                    userName={userName}
                    userEmail={userEmail}
                    userRole={userRole}
                    onMenuToggle={() =>
                        setOpenedOnPath((value) => (value === pathname ? null : pathname))
                    }
                />
                <main className={styles.content}>{children}</main>
            </div>
        </div>
    );
}
