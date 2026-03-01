import styles from '../admin-common.module.scss';

export default function OrdersLoading() {
    return (
        <main className={styles.main}>
            <h2 className={styles.sectionTitle}>Cargando pedidos...</h2>
            <p className={styles.label}>Estamos preparando el tablero de pedidos.</p>
        </main>
    );
}
