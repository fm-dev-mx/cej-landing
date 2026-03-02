'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateAdminLead } from '@/app/actions/updateAdminLead';
import type { DatabaseRowLeads } from '@/types/db/crm';
import type { DbLeadStatus } from '@/types/database-enums';
import styles from '../../admin-common.module.scss';

interface LeadDetailClientProps {
    initialData: DatabaseRowLeads;
}

const STATUS_OPTIONS: Array<{ value: DbLeadStatus; label: string }> = [
    { value: 'new', label: 'Nuevo' },
    { value: 'contacted', label: 'Contactado' },
    { value: 'qualified', label: 'Calificado' },
    { value: 'converted', label: 'Convertido' },
    { value: 'lost', label: 'Perdido' },
    { value: 'archived', label: 'Archivado' },
];

export default function LeadDetailClient({ initialData }: LeadDetailClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState(initialData.name);
    const [phone, setPhone] = useState(initialData.phone);
    const [status, setStatus] = useState<DbLeadStatus>(initialData.status);
    const [deliveryAddress, setDeliveryAddress] = useState(initialData.delivery_address || '');
    const [deliveryDate, setDeliveryDate] = useState(initialData.delivery_date || '');
    const [notes, setNotes] = useState(initialData.notes || '');
    const [lostReason, setLostReason] = useState(initialData.lost_reason || '');

    function withFeedback(successMessage: string) {
        setError(null);
        setMessage(successMessage);
        startTransition(() => {
            router.refresh();
        });
    }

    async function handleSaveOperational() {
        setError(null);
        setMessage(null);

        const result = await updateAdminLead({
            leadId: initialData.id,
            name,
            phone,
            delivery_address: deliveryAddress || null,
            delivery_date: deliveryDate || null,
            notes: notes || null,
            status,
            lost_reason: lostReason || null,
        });

        if (result.status !== 'success') {
            setError(result.message || 'No se pudo actualizar el lead');
            return;
        }

        withFeedback('Datos del lead actualizados correctamente.');
    }

    return (
        <div className={styles.wrapper}>
            {(message || error) && (
                <div className={message ? styles.toastSuccess : styles.toastError} role="status" aria-live="polite">
                    {message || error}
                </div>
            )}

            <section className={styles.section}>
                <h2>Resumen de Origen</h2>
                <div className={styles.grid}>
                    <p><strong>Customer ID vinculado:</strong> {initialData.customer_id || 'Sin vincular'}</p>
                    <p><strong>UTM Source:</strong> {initialData.utm_source || 'direct'}</p>
                    <p><strong>UTM Campaign:</strong> {initialData.utm_campaign || '-'}</p>
                    <p><strong>Creado el:</strong> {new Date(initialData.created_at).toLocaleString('es-MX')}</p>
                </div>
            </section>

            <section className={styles.section}>
                <h2>Editar Datos del Lead</h2>
                <div className={styles.formGrid}>
                    <label>
                        Nombre
                        <input value={name} onChange={(e) => setName(e.target.value)} />
                    </label>
                    <label>
                        Teléfono
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </label>
                    <label>
                        Estado
                        <select value={status} onChange={(e) => setStatus(e.target.value as DbLeadStatus)}>
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </label>

                    {status === 'lost' && (
                        <label>
                            Razón de pérdida
                            <input value={lostReason} onChange={(e) => setLostReason(e.target.value)} placeholder="Ej. Precio alto, no contesta..." />
                        </label>
                    )}

                    <label>
                        Dirección de entrega proyectada
                        <input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
                    </label>
                    <label>
                        Fecha de entrega proyectada
                        <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                    </label>

                    <label className={styles.gridFullWidth}>
                        Notas internas
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                    </label>
                </div>

                <div className={styles.formActions}>
                    <button type="button" className={styles.button} onClick={handleSaveOperational} disabled={isPending}>
                        {isPending ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>
            </section>
        </div>
    );
}
