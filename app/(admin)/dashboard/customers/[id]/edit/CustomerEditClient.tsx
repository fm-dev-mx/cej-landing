'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateAdminCustomer } from '@/app/actions/updateAdminCustomer';
import type { CustomerDetail } from '@/types/internal/customer';
import styles from '../../../admin-common.module.scss';

interface CustomerEditClientProps {
    initialData: CustomerDetail; // Re-use the aggregate
}

export default function CustomerEditClient({ initialData }: CustomerEditClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [displayName, setDisplayName] = useState(initialData.display_name);
    const [phone, setPhone] = useState(initialData.primary_phone_norm || '');
    const [email, setEmail] = useState(initialData.primary_email_norm || '');
    const [legacyNotes, setLegacyNotes] = useState(initialData.legacy_notes || '');

    const [billingEnabled, setBillingEnabled] = useState(initialData.billing_enabled || false);
    const [rfc, setRfc] = useState(initialData.rfc || '');
    const [billingRegimen, setBillingRegimen] = useState(initialData.billing_regimen || '');
    const [cfdiUse, setCfdiUse] = useState(initialData.cfdi_use || '');
    const [postalCode, setPostalCode] = useState(initialData.postal_code || '');

    function withFeedback(successMessage: string) {
        setError(null);
        setMessage(successMessage);
        startTransition(() => {
            router.refresh();
        });
    }

    async function handleSave() {
        setError(null);
        setMessage(null);

        const result = await updateAdminCustomer({
            customerId: initialData.id,
            display_name: displayName,
            phone: phone || null,
            email: email || null,
            legacy_notes: legacyNotes || null,
            billing_enabled: billingEnabled,
            rfc: rfc || null,
            billing_regimen: billingRegimen || null,
            cfdi_use: cfdiUse || null,
            postal_code: postalCode || null,
        });

        if (result.status !== 'success') {
            setError(result.message || 'No se pudo actualizar el cliente');
            return;
        }

        withFeedback('Datos del cliente actualizados correctamente.');
    }

    return (
        <div className={styles.wrapper}>
            {(message || error) && (
                <div className={message ? styles.toastSuccess : styles.toastError} role="status" aria-live="polite">
                    {message || error}
                </div>
            )}

            <section className={styles.section}>
                <h2>Datos Generales</h2>
                <div className={styles.formGrid}>
                    <label>
                        Razón Social o Nombre
                        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    </label>
                    <label>
                        Teléfono Principal
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
                    </label>
                    <label>
                        Email Principal
                        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
                    </label>
                    <label className={styles.gridFullWidth}>
                        Notas
                        <textarea value={legacyNotes} onChange={(e) => setLegacyNotes(e.target.value)} rows={2} />
                    </label>
                </div>
            </section>

            <section className={styles.section}>
                <h2>Datos de Facturación</h2>
                <div className={styles.formGrid}>
                    <label className={`${styles.gridFullWidth} ${styles.alignCenter} ${styles.gap2}`}>
                        <input type="checkbox" checked={billingEnabled} onChange={(e) => setBillingEnabled(e.target.checked)} />
                        Habilitar facturación para este cliente
                    </label>

                    <label>
                        RFC
                        <input value={rfc} onChange={(e) => setRfc(e.target.value)} className={styles.uppercase} />
                    </label>
                    <label>
                        Régimen Fiscal
                        <select value={billingRegimen} onChange={(e) => setBillingRegimen(e.target.value)}>
                            <option value="">Selecciona uno...</option>
                            <option value="601">601 - General de Ley Personas Morales</option>
                            <option value="612">612 - Personas Físicas con Actividades Empresariales</option>
                            <option value="626">626 - Régimen Simplificado de Confianza</option>
                        </select>
                    </label>
                    <label>
                        Uso CFDI
                        <input value={cfdiUse} onChange={(e) => setCfdiUse(e.target.value)} placeholder="Ej. G03" />
                    </label>
                    <label>
                        C.P. Fiscal
                        <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                    </label>
                </div>
            </section>

            <div className={styles.formActions}>
                <button type="button" className={styles.button} onClick={handleSave} disabled={isPending}>
                    {isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
            </div>
        </div>
    );
}
