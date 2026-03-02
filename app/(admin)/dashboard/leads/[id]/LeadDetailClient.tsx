'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateAdminLead } from '@/app/actions/updateAdminLead';
import { softDeleteEntity } from '@/app/actions/softDeleteEntity';
import ConfirmDialog from '@/components/ConfirmDialog';
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
    const [visitorId, setVisitorId] = useState(initialData.visitor_id || '');
    const [fbEventId, setFbEventId] = useState(initialData.fb_event_id || '');
    const [utmSource, setUtmSource] = useState(initialData.utm_source || '');
    const [utmMedium, setUtmMedium] = useState(initialData.utm_medium || '');
    const [utmCampaign, setUtmCampaign] = useState(initialData.utm_campaign || '');
    const [utmTerm, setUtmTerm] = useState(initialData.utm_term || '');
    const [utmContent, setUtmContent] = useState(initialData.utm_content || '');
    const [fbclid, setFbclid] = useState(initialData.fbclid || '');
    const [gclid, setGclid] = useState(initialData.gclid || '');
    const [showDelete, setShowDelete] = useState(false);

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
            visitor_id: visitorId || null,
            fb_event_id: fbEventId || null,
            utm_source: utmSource || null,
            utm_medium: utmMedium || null,
            utm_campaign: utmCampaign || null,
            utm_term: utmTerm || null,
            utm_content: utmContent || null,
            fbclid: fbclid || null,
            gclid: gclid || null,
        });

        if (result.status !== 'success') {
            setError(result.message || 'No se pudo actualizar el lead');
            return;
        }

        withFeedback('Datos del lead actualizados correctamente.');
    }

    async function handleDeleteLead() {
        setError(null);
        setMessage(null);
        const result = await softDeleteEntity('leads', initialData.id);
        if (!result.success) {
            setError(result.error || 'No se pudo eliminar el lead');
            return;
        }
        router.push('/dashboard/leads');
        router.refresh();
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
                    <p><strong>UTM Source:</strong> {utmSource || 'direct'}</p>
                    <p><strong>UTM Campaign:</strong> {utmCampaign || '-'}</p>
                    <p><strong>Creado el:</strong> {new Date(initialData.created_at).toLocaleString('es-MX')}</p>
                    <p><strong>Privacidad aceptada:</strong> {initialData.privacy_accepted ? 'Sí' : 'No'}</p>
                    <p><strong>Aceptación privacidad:</strong> {initialData.privacy_accepted_at || '-'}</p>
                </div>
                <div className={styles.formActions}>
                    <a className={styles.backLink} href={`/dashboard/customers/new?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&fromLead=${initialData.id}`}>
                        Crear cliente desde este lead
                    </a>
                    <a className={styles.backLink} href={`/dashboard/new?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&leadId=${initialData.id}&deliveryAddress=${encodeURIComponent(deliveryAddress)}`}>
                        Crear pedido desde este lead
                    </a>
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

                <details>
                    <summary>Campos avanzados</summary>
                    <div className={styles.formGrid}>
                        <label>
                            Visitor ID
                            <input value={visitorId} onChange={(e) => setVisitorId(e.target.value)} />
                        </label>
                        <label>
                            FB Event ID
                            <input value={fbEventId} onChange={(e) => setFbEventId(e.target.value)} />
                        </label>
                        <label>
                            UTM Source
                            <input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} />
                        </label>
                        <label>
                            UTM Medium
                            <input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} />
                        </label>
                        <label>
                            UTM Campaign
                            <input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} />
                        </label>
                        <label>
                            UTM Term
                            <input value={utmTerm} onChange={(e) => setUtmTerm(e.target.value)} />
                        </label>
                        <label>
                            UTM Content
                            <input value={utmContent} onChange={(e) => setUtmContent(e.target.value)} />
                        </label>
                        <label>
                            FBCLID
                            <input value={fbclid} onChange={(e) => setFbclid(e.target.value)} />
                        </label>
                        <label>
                            GCLID
                            <input value={gclid} onChange={(e) => setGclid(e.target.value)} />
                        </label>
                        <p className={styles.gridFullWidth}>
                            <strong>Quote data (solo lectura):</strong> {JSON.stringify(initialData.quote_data)}
                        </p>
                    </div>
                </details>

                <div className={styles.formActions}>
                    <button type="button" className={styles.backLink} onClick={() => setShowDelete(true)}>
                        Eliminar lead
                    </button>
                    <button type="button" className={styles.button} onClick={handleSaveOperational} disabled={isPending}>
                        {isPending ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>
            </section>

            <ConfirmDialog
                open={showDelete}
                title="Eliminar lead"
                description="Esta acción aplicará borrado lógico del lead y lo ocultará de los listados."
                confirmLabel="Sí, eliminar"
                onCancel={() => setShowDelete(false)}
                onConfirm={handleDeleteLead}
            />
        </div>
    );
}
