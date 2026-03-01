'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAdminOrder, type AdminOrderPayload } from '@/app/actions/createAdminOrder';
import { listServiceSlots } from '@/app/actions/listServiceSlots';
import { listAssignableProfiles } from '@/app/actions/listAssignableProfiles';
import type { ProfileOption, ServiceSlotOption } from '@/types/internal/order-admin';
import styles from './page.module.scss';

export function AdminOrderForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [slots, setSlots] = useState<ServiceSlotOption[]>([]);
    const [profiles, setProfiles] = useState<ProfileOption[]>([]);

    useEffect(() => {
        let mounted = true;
        Promise.all([listServiceSlots(), listAssignableProfiles()])
            .then(([slotsRes, profilesRes]) => {
                if (!mounted) return;
                if (slotsRes.success) setSlots(slotsRes.slots);
                if (profilesRes.success) setProfiles(profilesRes.profiles);
            })
            .catch(() => {
                if (mounted) {
                    setSlots([]);
                    setProfiles([]);
                }
            });

        return () => {
            mounted = false;
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const toIsoOrUndefined = (value: FormDataEntryValue | null): string | undefined => {
            if (!value) return undefined;
            const raw = String(value).trim();
            if (!raw) return undefined;
            const parsed = new Date(raw);
            if (Number.isNaN(parsed.getTime())) return undefined;
            return parsed.toISOString();
        };

        const payload: AdminOrderPayload = {
            name: formData.get('name') as string,
            phone: formData.get('phone') as string,
            volume: parseFloat(formData.get('volume') as string),
            concreteType: formData.get('concreteType') as 'direct' | 'pumped',
            strength: formData.get('strength') as string,
            deliveryAddress: formData.get('deliveryAddress') as string,
            sellerId: (formData.get('sellerId') as string) || undefined,
            orderedAt: toIsoOrUndefined(formData.get('orderedAt')),
            deliveryDate: (formData.get('deliveryDate') as string) || undefined,
            scheduledWindowStart: toIsoOrUndefined(formData.get('scheduledWindowStart')),
            scheduledWindowEnd: toIsoOrUndefined(formData.get('scheduledWindowEnd')),
            scheduledSlotCode: (formData.get('scheduledSlotCode') as string) || undefined,
            scheduledTimeLabel: (formData.get('scheduledTimeLabel') as string) || undefined,
            externalRef: (formData.get('externalRef') as string) || undefined,
            legacyFolioRaw: (formData.get('legacyFolioRaw') as string) || undefined,
            notes: (formData.get('notes') as string) || undefined,
            utm_source: (formData.get('utm_source') as string) || undefined,
            utm_medium: (formData.get('utm_medium') as string) || undefined,
            utm_campaign: (formData.get('utm_campaign') as string) || undefined,
            utm_term: (formData.get('utm_term') as string) || undefined,
            utm_content: (formData.get('utm_content') as string) || undefined,
            fbclid: (formData.get('fbclid') as string) || undefined,
            gclid: (formData.get('gclid') as string) || undefined,
        };

        const result = await createAdminOrder(payload);

        if (result.status === 'success') {
            router.push(`/dashboard/orders/${result.id}`);
            router.refresh();
            return;
        }

        setError(result.message);
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.grid}>
                <div className={styles.field}>
                    <label htmlFor="name">Nombre del Cliente</label>
                    <input type="text" id="name" name="name" required placeholder="Ej. Juan Pérez" />
                </div>

                <div className={styles.field}>
                    <label htmlFor="phone">Teléfono</label>
                    <input type="tel" id="phone" name="phone" required placeholder="656 000 0000" />
                </div>

                <div className={styles.field}>
                    <label htmlFor="volume">Volumen (m³)</label>
                    <input type="number" id="volume" name="volume" step="0.5" min="1" required placeholder="Ej. 5.5" />
                </div>

                <div className={styles.field}>
                    <label htmlFor="concreteType">Tipo de Servicio</label>
                    <select id="concreteType" name="concreteType" required>
                        <option value="direct">Tiro Directo</option>
                        <option value="pumped">Bomba</option>
                    </select>
                </div>

                <div className={styles.field}>
                    <label htmlFor="strength">Resistencia (f&apos;c)</label>
                    <select id="strength" name="strength" required>
                        <option value="100">f&apos;c 100</option>
                        <option value="150">f&apos;c 150</option>
                        <option value="200">f&apos;c 200</option>
                        <option value="250">f&apos;c 250</option>
                        <option value="300">f&apos;c 300</option>
                    </select>
                </div>

                <div className={styles.field}>
                    <label htmlFor="sellerId">Vendedor asignado</label>
                    <select id="sellerId" name="sellerId" defaultValue="">
                        <option value="">Usuario actual</option>
                        {profiles.map((profile) => (
                            <option key={profile.id} value={profile.id}>
                                {profile.full_name || profile.email || profile.id}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.field}>
                    <label htmlFor="orderedAt">Fecha/Hora de pedido</label>
                    <input type="datetime-local" id="orderedAt" name="orderedAt" />
                </div>

                <div className={styles.field}>
                    <label htmlFor="deliveryDate">Fecha Estimada</label>
                    <input type="date" id="deliveryDate" name="deliveryDate" />
                </div>

                <div className={styles.field}>
                    <label htmlFor="scheduledSlotCode">Franja de servicio</label>
                    <select id="scheduledSlotCode" name="scheduledSlotCode" defaultValue="">
                        <option value="">Sin franja</option>
                        {slots.map((slot) => (
                            <option key={slot.slot_code} value={slot.slot_code}>
                                {slot.label} ({slot.start_time} - {slot.end_time})
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.field}>
                    <label htmlFor="scheduledTimeLabel">Etiqueta de horario</label>
                    <input type="text" id="scheduledTimeLabel" name="scheduledTimeLabel" placeholder="Ej. 08:00 - 10:00" />
                </div>

                <div className={styles.field}>
                    <label htmlFor="scheduledWindowStart">Ventana inicio</label>
                    <input type="datetime-local" id="scheduledWindowStart" name="scheduledWindowStart" />
                </div>

                <div className={styles.field}>
                    <label htmlFor="scheduledWindowEnd">Ventana fin</label>
                    <input type="datetime-local" id="scheduledWindowEnd" name="scheduledWindowEnd" />
                </div>

                <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label htmlFor="deliveryAddress">Dirección de Entrega</label>
                    <input type="text" id="deliveryAddress" name="deliveryAddress" required placeholder="Calle, Número, Colonia" />
                </div>

                <div className={styles.field}>
                    <label htmlFor="externalRef">Referencia externa</label>
                    <input id="externalRef" name="externalRef" placeholder="Código interno/ERP" />
                </div>

                <div className={styles.field}>
                    <label htmlFor="legacyFolioRaw">Folio legado</label>
                    <input id="legacyFolioRaw" name="legacyFolioRaw" placeholder="Folio previo" />
                </div>

                <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label htmlFor="notes">Notas Internas</label>
                    <textarea id="notes" name="notes" rows={3} placeholder="Instrucciones adicionales..." />
                </div>

                <details className={`${styles.field} ${styles.fullWidth}`}>
                    <summary>Campos de atribución (avanzado)</summary>
                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label htmlFor="utm_source">UTM Source</label>
                            <input id="utm_source" name="utm_source" />
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="utm_medium">UTM Medium</label>
                            <input id="utm_medium" name="utm_medium" />
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="utm_campaign">UTM Campaign</label>
                            <input id="utm_campaign" name="utm_campaign" />
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="utm_term">UTM Term</label>
                            <input id="utm_term" name="utm_term" />
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="utm_content">UTM Content</label>
                            <input id="utm_content" name="utm_content" />
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="fbclid">FBCLID</label>
                            <input id="fbclid" name="fbclid" />
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="gclid">GCLID</label>
                            <input id="gclid" name="gclid" />
                        </div>
                    </div>
                </details>
            </div>

            {error && <div className={styles.error} role="alert">{error}</div>}

            <div className={styles.footer}>
                <button type="submit" disabled={loading} className={styles.submitButton}>
                    {loading ? 'Registrando...' : 'Registrar Pedido'}
                </button>
            </div>
        </form>
    );
}
