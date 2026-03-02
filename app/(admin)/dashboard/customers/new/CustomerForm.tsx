'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAdminCustomer } from '@/app/actions/createAdminCustomer';
import styles from '../../admin-common.module.scss';

interface CustomerFormProps {
    initialName?: string;
    initialPhone?: string;
}

export default function CustomerForm({ initialName = '', initialPhone = '' }: CustomerFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        const payload = {
            display_name: formData.get('display_name') as string,
            phone: formData.get('phone') as string,
            email: (formData.get('email') as string) || undefined,
            rfc: (formData.get('rfc') as string) || undefined,
            billing_enabled: formData.get('billing_enabled') === 'on',
            billing_regimen: (formData.get('billing_regimen') as string) || undefined,
            cfdi_use: (formData.get('cfdi_use') as string) || undefined,
            postal_code: (formData.get('postal_code') as string) || undefined,
            quality_tier: ((formData.get('quality_tier') as string) || undefined) as 'bronze' | 'silver' | 'gold' | 'platinum' | undefined,
            legacy_notes: (formData.get('legacy_notes') as string) || undefined,
        };

        const result = await createAdminCustomer(payload);

        if (result.status === 'success') {
            router.push(`/dashboard/customers/${result.id}`);
            router.refresh();
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.errorText} role="alert">{error}</div>}

            <div className={styles.grid}>
                <div className={styles.formGroup}>
                    <label htmlFor="display_name" className={styles.label}>Nombre completo o Razón Social *</label>
                    <input id="display_name" name="display_name" required className={styles.input} defaultValue={initialName} placeholder="Ej. Juan Pérez" />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="phone" className={styles.label}>Teléfono principal *</label>
                    <input id="phone" name="phone" type="tel" required className={styles.input} defaultValue={initialPhone} placeholder="10 dígitos" />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>Email (opcional)</label>
                    <input id="email" name="email" type="email" className={styles.input} placeholder="ejemplo@correo.com" />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="legacy_notes" className={styles.label}>Notas</label>
                    <textarea id="legacy_notes" name="legacy_notes" className={styles.input} rows={2} />
                </div>
            </div>

            <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>Información de Facturación</legend>
                <div className={styles.grid}>
                    <div className={`${styles.formGroup} ${styles.gridFullWidth}`}>
                        <label className={`${styles.label} ${styles.alignCenter} ${styles.gap2}`}>
                            <input type="checkbox" name="billing_enabled" />
                            Habilitar facturación para este cliente
                        </label>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="rfc" className={styles.label}>RFC</label>
                        <input id="rfc" name="rfc" className={`${styles.input} ${styles.uppercase}`} placeholder="ABC123456T1" />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="billing_regimen" className={styles.label}>Régimen Fiscal</label>
                        <select id="billing_regimen" name="billing_regimen" className={styles.input} defaultValue="">
                            <option value="">Selecciona uno...</option>
                            <option value="601">601 - General de Ley Personas Morales</option>
                            <option value="612">612 - Personas Físicas con Actividades Empresariales</option>
                            <option value="626">626 - Régimen Simplificado de Confianza</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="cfdi_use" className={styles.label}>Uso CFDI</label>
                        <input id="cfdi_use" name="cfdi_use" className={styles.input} placeholder="G03" />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="postal_code" className={styles.label}>C.P. Fiscal</label>
                        <input id="postal_code" name="postal_code" className={styles.input} placeholder="32000" />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="quality_tier" className={styles.label}>Tier de calidad</label>
                        <select id="quality_tier" name="quality_tier" className={styles.input} defaultValue="">
                            <option value="">Sin definir</option>
                            <option value="bronze">Bronce</option>
                            <option value="silver">Plata</option>
                            <option value="gold">Oro</option>
                            <option value="platinum">Platino</option>
                        </select>
                    </div>
                </div>
            </fieldset>

            <div className={styles.formActions}>
                <button type="submit" disabled={loading} className={styles.button}>
                    {loading ? 'Guardando...' : 'Crear Cliente'}
                </button>
            </div>
        </form>
    );
}
