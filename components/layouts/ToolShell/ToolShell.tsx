// components/layouts/ToolShell/ToolShell.tsx
// ACTIVE: Used by app/(app)/cotizador/page.tsx as the app shell for the cotizador route.
// TODO(phase-4b): Replace with the Phase 4B authenticated dashboard shell once designed.
import Link from 'next/link';
import { ReactNode } from 'react';
import styles from './ToolShell.module.scss';

type ToolShellProps = {
    children: ReactNode;
    actions?: ReactNode; // Slot for ExpertToggle later
};

export default function ToolShell({ children, actions }: ToolShellProps) {
    return (
        <div className={styles.shell}>
            <header className={styles.header}>
                <Link href="/" className={styles.brand}>
                    CEJ PRO
                </Link>
                <div className={styles.actions}>
                    {actions}
                </div>
            </header>

            <main className={styles.main}>
                {children}
            </main>

            {/* Placeholders for Drawer & Toast will go here in Phase 2/3 */}
        </div>
    );
}
