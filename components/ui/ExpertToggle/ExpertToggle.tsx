'use client';

import { useCejStore } from '@/store/useCejStore';
import styles from './ExpertToggle.module.scss';

export default function ExpertToggle() {
    const mode = useCejStore(s => s.draft.mode);
    const setMode = useCejStore(s => s.setMode);

    const isExpert = mode === 'knownM3';

    const toggle = () => {
        setMode(isExpert ? 'assistM3' : 'knownM3');
    };

    return (
        <button
            className={styles.toggle}
            onClick={toggle}
            aria-label={`Cambiar a modo ${!isExpert ? 'Experto' : 'Guiado'}`}
        >
            <span className={`${styles.label} ${!isExpert ? styles.active : ''}`}>
                Guía
            </span>
            <div className={styles.track}>
                <div className={`${styles.thumb} ${isExpert ? styles.thumbRight : ''}`} />
            </div>
            <span className={`${styles.label} ${isExpert ? styles.active : ''}`}>
                Pro
            </span>
        </button>
    );
}
