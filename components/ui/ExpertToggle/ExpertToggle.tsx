'use client';

import { useCejStore } from '@/store/useCejStore';
import styles from './ExpertToggle.module.scss';

export default function ExpertToggle() {
    const isExpert = useCejStore(s => s.draft.showExpertOptions);
    const setExpertMode = useCejStore(s => s.setExpertMode);

    return (
        <button
            className={styles.toggle}
            onClick={() => setExpertMode(!isExpert)}
            aria-label={`Cambiar a modo ${!isExpert ? 'Experto' : 'Básico'}`}
            title="Activar selección de aditivos"
        >
            <span className={`${styles.label} ${!isExpert ? styles.active : ''}`}>
                Básico
            </span>
            <div className={styles.track}>
                <div className={`${styles.thumb} ${isExpert ? styles.thumbRight : ''}`} />
            </div>
            <span className={`${styles.label} ${isExpert ? styles.active : ''}`}>
                +Aditivos
            </span>
        </button>
    );
}
