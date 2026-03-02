import styles from '../admin-common.module.scss';

export default function CustomersLoading() {
    return (
        <main className={styles.main}>
            <h2 className={styles.sectionTitle}>Cargando clientes...</h2>
            <p className={styles.label}>Estamos preparando el tablero de clientes.</p>
        </main>
    );
}
