'use client';

import { useEffect } from 'react';
import styles from '../admin-common.module.scss';

export default function LeadsError({ error }: { error: Error & { digest?: string } }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className={styles.main}>
            <h2 className={styles.sectionTitle}>No pudimos cargar el módulo de leads</h2>
            <p className={styles.errorText} role="alert">{error.message || 'Error inesperado'}</p>
        </main>
    );
}
