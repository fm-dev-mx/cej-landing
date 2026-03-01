'use client';

import { useState } from 'react';
import Link from 'next/link';
import { exportReport } from '@/app/actions/exportReport';
import styles from '../admin-common.module.scss';
export default function ReportsPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleExport = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        const formData = new FormData(e.currentTarget);
        const start = formData.get('startDate') as string;
        const end = formData.get('endDate') as string;

        const res = await exportReport(
            new Date(start).toISOString(),
            new Date(end + 'T23:59:59.999Z').toISOString()
        );

        if (res.success && res.csv) {
            const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `reporte_cej_${start}_a_${end}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setResult('Exportado exitosamente.');
        } else {
            setResult(res.error || 'Error al exportar.');
        }
        setLoading(false);
    };

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <h1>Reportes (CSV)</h1>
                <Link href="/dashboard" className={styles.backLink}>Volver al dashboard</Link>
            </div>

            <form onSubmit={handleExport} className={styles.form}>
                <div className={styles.formGroup}>
                    <label>Fecha de Inicio</label>
                    <input type="date" name="startDate" className={styles.input} required />
                </div>
                <div className={styles.formGroup}>
                    <label>Fecha de Fin</label>
                    <input type="date" name="endDate" className={styles.input} required />
                </div>
                <button type="submit" disabled={loading} className={styles.button}>
                    {loading ? 'Generando...' : 'Descargar CSV'}
                </button>
            </form>

            {result && <p className={styles.resultText}>{result}</p>}
        </main>
    );
}
