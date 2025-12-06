'use client';

import { useCejStore } from '@/store/useCejStore';
import styles from './ExpertToggle.module.scss';

export default function ExpertToggle() {
    const viewMode = useCejStore(s => s.viewMode);
    const toggle = useCejStore(s => s.toggleViewMode);

    return (
        <button
            className={styles.toggle}
            onClick={toggle}
            aria-label={`Cambiar a modo ${viewMode === 'wizard' ? 'Experto' : 'Guiado'}`}
        >
            <span className={`${styles.label} ${viewMode === 'wizard' ? styles.active : ''}`}>
                Guía
            </span>
            <div className={styles.track}>
                <div className={`${styles.thumb} ${viewMode === 'expert' ? styles.thumbRight : ''}`} />
            </div>
            <span className={`${styles.label} ${viewMode === 'expert' ? styles.active : ''}`}>
                Pro
            </span>
        </button>
    );
}
