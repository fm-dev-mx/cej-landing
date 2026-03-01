import { Metadata } from 'next';
import { listExpenses } from '@/app/actions/listFinancials';
import { ExpenseForm } from '@/components/internal/financials/ExpenseForm';
import styles from '../admin-common.module.scss';

export const metadata: Metadata = { title: 'Gastos Operativos | CEJ Pro', robots: 'noindex' };

export default async function ExpensesPage() {
    const { data: expenses } = await listExpenses();

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <h1>Gastos Operativos</h1>
            </div>

            <div className={styles.contentGrid}>
                <aside className={styles.formSidebar}>
                    <ExpenseForm />
                </aside>

                <section className={styles.listSection}>
                    <h2 className={styles.sectionTitle}>Historial de Gastos</h2>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.tableHeaderRow}>
                                <th className={styles.tableHeader}>Fecha</th>
                                <th className={styles.tableHeader}>Categoría</th>
                                <th className={styles.tableHeader}>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses?.map(e => (
                                <tr key={e.id}>
                                    <td className={styles.tableCell}>{new Date(e.expenseDate).toLocaleDateString('es-MX')}</td>
                                    <td className={styles.tableCell}>{e.category}</td>
                                    <td className={styles.tableCell}>${e.amount} {e.currency}</td>
                                </tr>
                            ))}
                            {(!expenses || expenses.length === 0) && (
                                <tr><td colSpan={3} className={styles.emptyCell}>No hay gastos registrados</td></tr>
                            )}
                        </tbody>
                    </table>
                </section>
            </div>
        </main>
    );
}
