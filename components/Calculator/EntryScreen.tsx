'use client';

import { useCejStore } from '@/store/useCejStore';
import styles from './EntryScreen.module.scss';

export function EntryScreen() {
    const setMode = useCejStore((s) => s.setMode);

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>
                        Cotiza tu <span className={styles.accent}>concreto</span> en menos de 1 minuto
                    </h1>
                    <p className={styles.subtitle}>
                        Selecciona cómo prefieres comenzar para obtener tu presupuesto al instante.
                    </p>
                </header>

                <div className={styles.grid}>
                    <button
                        type="button"
                        className={`${styles.optionCard} ${styles.cardKnown}`}
                        onClick={() => setMode('knownM3')}
                    >
                        <div className={styles.cardContent}>
                            <div className={styles.iconWrapper}>
                                <span className={styles.icon}>🚚</span>
                            </div>
                            <div className={styles.textContainer}>
                                <h3 className={styles.cardTitle}>Ya sé cuántos m³ necesito</h3>
                                <p className={styles.cardDescription}>
                                    Ingresa el volumen directo si ya tienes el cálculo de tu obra.
                                </p>
                            </div>
                            <div className={styles.arrow}>→</div>
                        </div>
                    </button>

                    <button
                        type="button"
                        className={`${styles.optionCard} ${styles.cardAssist}`}
                        onClick={() => setMode('assistM3')}
                    >
                        <div className={styles.cardContent}>
                            <div className={styles.iconWrapper}>
                                <span className={styles.icon}>📐</span>
                            </div>
                            <div className={styles.textContainer}>
                                <h3 className={styles.cardTitle}>Ayúdame a calcularlo</h3>
                                <p className={styles.cardDescription}>
                                    Calcularemos el volumen basado en las medidas de tu área.
                                </p>
                            </div>
                            <div className={styles.arrow}>→</div>
                        </div>
                    </button>
                </div>

                <div className={styles.footer}>
                    <p className={styles.trustNote}>
                        🔒 Precios oficiales actualizados hoy.
                    </p>
                </div>
            </div>
        </div>
    );
}
