'use client';

import { useEffect, useState } from 'react';
import { useCejStore } from '@/store/useCejStore';
import styles from './FeedbackToast.module.scss';

export default function FeedbackToast() {
    const isDrawerOpen = useCejStore(s => s.isDrawerOpen);
    const cart = useCejStore(s => s.cart);
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Trigger toast only when a NEW item is added (length increases)
        // For MVP simplicity, we assume if drawer opens and cart has items, it's an add action
        if (isDrawerOpen && cart.length > 0) {
            setShow(true);
            const timer = setTimeout(() => setShow(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isDrawerOpen, cart.length]);

    if (!show) return null;

    return (
        <div className={styles.toast} role="status">
            <span className={styles.icon}>✅</span>
            <div className={styles.content}>
                <p className={styles.title}>Agregado al pedido</p>
                <p className={styles.subtitle}>Tu cálculo se guardó correctamente.</p>
            </div>
        </div>
    );
}
