'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPayrollEntry } from '@/app/actions/createFinancials';
import { payrollPayloadSchema } from '@/lib/schemas/internal/financials';
import styles from '@/app/(admin)/dashboard/admin-common.module.scss';

export function PayrollForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData(e.currentTarget);
        const payload = {
            employee: formData.get('employee') as string,
            amount: Number(formData.get('amount')),
            periodStart: formData.get('periodStart') as string,
            periodEnd: formData.get('periodEnd') as string,
            notes: formData.get('notes') as string || undefined,
        };

        // Client-side validation
        const result = payrollPayloadSchema.safeParse(payload);
        if (!result.success) {
            setError(result.error.errors[0].message);
            setLoading(false);
            return;
        }

        const res = await createPayrollEntry(result.data);
        if (res.success) {
            setSuccess(true);
            (e.target as HTMLFormElement).reset();
            router.refresh();
        } else {
            setError(res.error || 'Error al guardar la nómina');
        }
        setLoading(false);
    };

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Registrar Nueva Nómina</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Empleado</label>
                        <input
                            name="employee"
                            type="text"
                            required
                            className={styles.input}
                            placeholder="Nombre del empleado"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Monto (MXN)</label>
                        <input
                            name="amount"
                            type="number"
                            step="0.01"
                            required
                            className={styles.input}
                            placeholder="0.00"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Periodo Inicio</label>
                        <input
                            name="periodStart"
                            type="date"
                            required
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Periodo Fin</label>
                        <input
                            name="periodEnd"
                            type="date"
                            required
                            className={styles.input}
                        />
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Notas (Opcional)</label>
                    <textarea
                        name="notes"
                        className={styles.input}
                        rows={2}
                        placeholder="Detalles adicionales..."
                    />
                </div>

                <div className={styles.formActions}>
                    <button type="submit" disabled={loading} className={styles.button}>
                        {loading ? 'Guardando...' : 'Registrar Nómina'}
                    </button>
                </div>

                {error && <p className={styles.errorText}>{error}</p>}
                {success && <p className={styles.successText}>¡Nómina registrada con éxito!</p>}
            </form>
        </section>
    );
}
