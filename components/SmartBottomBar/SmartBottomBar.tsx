// components/SmartBottomBar/SmartBottomBar.tsx
'use client';

import { usePublicStore } from "@/store/public/usePublicStore";
import { fmtMXN } from '@/lib/utils';
import styles from './SmartBottomBar.module.scss';

export default function SmartBottomBar() {
    const cart = usePublicStore(s => s.cart);
    const setDrawerOpen = usePublicStore(s => s.setDrawerOpen);

    // Only show if cart has items
    if (cart.length === 0) return null;

    const total = cart.reduce((acc, item) => acc + item.results.total, 0);
    const count = cart.length;

    return (
        <div className={styles.bar}>
            <div className={styles.info}>
                <span className={styles.countBadge}>{count}</span>
                <div className={styles.textColumn}>
                    <span className={styles.label}>Tu Pedido</span>
                    <span className={styles.total}>{fmtMXN(total)}</span>
                </div>
            </div>

            <button
                className={styles.triggerBtn}
                onClick={() => setDrawerOpen(true)}
            >
                Ver Lista
            </button>
        </div>
    );
}
