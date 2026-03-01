'use client';

import { useEffect, useState } from 'react';
import styles from './AdminShell.module.scss';
import AdminSidebar from '@/components/AdminSidebar';
import AdminTopbar from '@/components/AdminTopbar';

interface AdminShellProps {
    children: React.ReactNode;
    userName: string;
    userEmail: string;
}

export default function AdminShell({
    children,
    userName,
    userEmail,
}: AdminShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsSidebarOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false);
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
                    onMenuToggle={() => setIsSidebarOpen((value) => !value)}
                />
                <main className={styles.content}>{children}</main>
            </div>
        </div>
    );
}
