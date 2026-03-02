'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAdminLead } from '@/app/actions/createAdminLead';
import styles from '../../admin-common.module.scss';
import type { DbLeadStatus } from '@/types/database-enums';

export default function LeadForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        const payload = {
            name: formData.get('name') as string,
            phone: formData.get('phone') as string,
            delivery_date: (formData.get('delivery_date') as string) || undefined,
            delivery_address: (formData.get('delivery_address') as string) || undefined,
            notes: (formData.get('notes') as string) || undefined,
            status: (formData.get('status') as DbLeadStatus) || 'new',
        };

        const result = await createAdminLead(payload);

        if (result.status === 'success') {
            router.push(`/dashboard/leads/${result.id}`);
            router.refresh();
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.errorText} role="alert">{error}</div>}

            <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.label}>Nombre completo *</label>
                    <input id="name" name="name" required className={styles.input} placeholder="Ej. Juan Pérez" />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="phone" className={styles.label}>Teléfono *</label>
                    <input id="phone" name="phone" type="tel" required className={styles.input} placeholder="10 dígitos" />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="status" className={styles.label}>Estado inicial</label>
                    <select id="status" name="status" className={styles.input} defaultValue="new">
                        <option value="new">Nuevo (new)</option>
                        <option value="contacted">Contactado (contacted)</option>
                        <option value="qualified">Calificado (qualified)</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="delivery_date" className={styles.label}>Fecha proyectada</label>
                    <input id="delivery_date" name="delivery_date" type="date" className={styles.input} />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="delivery_address" className={styles.label}>Dirección proyectada</label>
                    <input id="delivery_address" name="delivery_address" className={styles.input} placeholder="Calle, número, colonia..." />
                </div>

                <div className={`${styles.formGroup} ${styles.gridFullWidth}`}>
                    <label htmlFor="notes" className={styles.label}>Notas internas</label>
                    <textarea id="notes" name="notes" className={styles.input} rows={3} placeholder="Detalles de lo que busca el cliente..." />
                </div>
            </div>

            <div className={styles.formActions}>
                <button type="submit" disabled={loading} className={styles.button}>
                    {loading ? 'Guardando...' : 'Crear Lead'}
                </button>
            </div>
        </form>
    );
}
