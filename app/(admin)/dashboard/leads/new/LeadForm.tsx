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
            visitor_id: (formData.get('visitor_id') as string) || undefined,
            fb_event_id: (formData.get('fb_event_id') as string) || undefined,
            utm_source: (formData.get('utm_source') as string) || undefined,
            utm_medium: (formData.get('utm_medium') as string) || undefined,
            utm_campaign: (formData.get('utm_campaign') as string) || undefined,
            utm_term: (formData.get('utm_term') as string) || undefined,
            utm_content: (formData.get('utm_content') as string) || undefined,
            fbclid: (formData.get('fbclid') as string) || undefined,
            gclid: (formData.get('gclid') as string) || undefined,
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

            <details>
                <summary>Campos avanzados</summary>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label htmlFor="visitor_id" className={styles.label}>Visitor ID</label>
                        <input id="visitor_id" name="visitor_id" className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="fb_event_id" className={styles.label}>FB Event ID</label>
                        <input id="fb_event_id" name="fb_event_id" className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="utm_source" className={styles.label}>UTM Source</label>
                        <input id="utm_source" name="utm_source" className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="utm_medium" className={styles.label}>UTM Medium</label>
                        <input id="utm_medium" name="utm_medium" className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="utm_campaign" className={styles.label}>UTM Campaign</label>
                        <input id="utm_campaign" name="utm_campaign" className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="utm_term" className={styles.label}>UTM Term</label>
                        <input id="utm_term" name="utm_term" className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="utm_content" className={styles.label}>UTM Content</label>
                        <input id="utm_content" name="utm_content" className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="fbclid" className={styles.label}>FBCLID</label>
                        <input id="fbclid" name="fbclid" className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="gclid" className={styles.label}>GCLID</label>
                        <input id="gclid" name="gclid" className={styles.input} />
                    </div>
                </div>
            </details>
        </form>
    );
}
