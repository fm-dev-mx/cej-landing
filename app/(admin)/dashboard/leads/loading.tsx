import styles from '../admin-common.module.scss';

export default function LeadsLoading() {
    return (
        <main className={styles.main}>
            <h2 className={styles.sectionTitle}>Cargando leads...</h2>
            <p className={styles.label}>Estamos preparando el tablero de leads.</p>
        </main>
    );
}
