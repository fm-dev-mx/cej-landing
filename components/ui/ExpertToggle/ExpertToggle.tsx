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
            // A11y: Semantic toggle state
            aria-pressed={isExpert}
            type="button"
            title="Activar selección de aditivos"
        >
            <span className={`${styles.label} ${!isExpert ? styles.active : ''}`} aria-hidden="true">
                Básico
            </span>
            <div className={styles.track}>
                <div className={`${styles.thumb} ${isExpert ? styles.thumbRight : ''}`} />
            </div>
            <span className={`${styles.label} ${isExpert ? styles.active : ''}`} aria-hidden="true">
                +Aditivos
            </span>
            <span className="sr-only">
                {isExpert ? "Modo experto activado" : "Modo básico activado"}
            </span>
        </button>
    );
}
