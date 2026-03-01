'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createExpense } from '@/app/actions/createFinancials';
import { expensePayloadSchema } from '@/lib/schemas/internal/financials';
import styles from '@/app/(admin)/dashboard/admin-common.module.scss';

export function ExpenseForm() {
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
            amount: Number(formData.get('amount')),
            category: formData.get('category') as string,
            expenseDate: formData.get('expenseDate') as string,
            reference: formData.get('reference') as string || undefined,
            notes: formData.get('notes') as string || undefined,
        };

        // Client-side validation
        const result = expensePayloadSchema.safeParse(payload);
        if (!result.success) {
            setError(result.error.errors[0].message);
            setLoading(false);
            return;
        }

        const res = await createExpense(result.data);
        if (res.success) {
            setSuccess(true);
            (e.target as HTMLFormElement).reset();
            router.refresh();
        } else {
            setError(res.error || 'Error al guardar el gasto');
        }
        setLoading(false);
    };

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Registrar Nuevo Gasto</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
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
                        <label className={styles.label}>Categoría</label>
                        <select name="category" required className={styles.input}>
                            <option value="">Seleccionar...</option>
                            <option value="Gasolina">Gasolina</option>
                            <option value="Mantenimiento">Mantenimiento</option>
                            <option value="Materiales">Materiales</option>
                            <option value="Herramientas">Herramientas</option>
                            <option value="Otros">Otros</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Fecha</label>
                        <input
                            name="expenseDate"
                            type="date"
                            required
                            className={styles.input}
                            defaultValue={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Referencia (Opcional)</label>
                        <input
                            name="reference"
                            type="text"
                            className={styles.input}
                            placeholder="Ej. Factura #123"
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
                        {loading ? 'Guardando...' : 'Registrar Gasto'}
                    </button>
                </div>

                {error && <p className={styles.errorText}>{error}</p>}
                {success && <p className={styles.successText}>¡Gasto registrado con éxito!</p>}
            </form>
        </section>
    );
}
