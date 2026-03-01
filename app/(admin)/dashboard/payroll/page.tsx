import { Metadata } from 'next';
import { listPayrollEntries } from '@/app/actions/listFinancials';
import { PayrollForm } from '@/components/internal/financials/PayrollForm';
import styles from '../admin-common.module.scss';

export const metadata: Metadata = { title: 'Nómina Operativa | CEJ Pro', robots: 'noindex' };

export default async function PayrollPage() {
    const { data: payroll } = await listPayrollEntries();

    return (
        <main className={styles.main}>
            <h2 className={styles.sectionTitle}>Registro de nómina operativa</h2>

            <div className={styles.contentGrid}>
                <aside className={styles.formSidebar}>
                    <PayrollForm />
                </aside>

                <section className={styles.listSection}>
                    <h2 className={styles.sectionTitle}>Historial de Nóminas</h2>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.tableHeaderRow}>
                                <th className={styles.tableHeader}>Empleado</th>
                                <th className={styles.tableHeader}>Periodo (Fin)</th>
                                <th className={styles.tableHeader}>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payroll?.map(p => (
                                <tr key={p.id}>
                                    <td className={styles.tableCell}>{p.employee}</td>
                                    <td className={styles.tableCell}>{new Date(p.periodEnd).toLocaleDateString('es-MX')}</td>
                                    <td className={styles.tableCell}>${p.amount} {p.currency}</td>
                                </tr>
                            ))}
                            {(!payroll || payroll.length === 0) && (
                                <tr><td colSpan={3} className={styles.emptyCell}>No hay registros de nómina</td></tr>
                            )}
                        </tbody>
                    </table>
                </section>
            </div>
        </main>
    );
}
