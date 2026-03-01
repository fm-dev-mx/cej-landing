import { Metadata } from 'next';
import Link from 'next/link';
import { listPayrollEntries } from '@/app/actions/listFinancials';
import styles from '../admin-common.module.scss';
export const metadata: Metadata = { title: 'Nómina Operativa | CEJ Pro', robots: 'noindex' };

export default async function PayrollPage() {
    const { data: payroll } = await listPayrollEntries();

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <h1>Nómina Operativa</h1>
                <Link href="/dashboard" className={styles.backLink}>Volver al dashboard</Link>
            </div>

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
        </main>
    );
}
