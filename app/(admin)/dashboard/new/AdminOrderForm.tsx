'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAdminOrder, type AdminOrderPayload } from '@/app/actions/createAdminOrder';
import { findCustomerByPhone, type PhoneCustomerMatch } from '@/app/actions/findCustomerByPhone';
import { listServiceSlots } from '@/app/actions/listServiceSlots';
import type { ServiceSlotOption } from '@/types/internal/order-admin';
import styles from './page.module.scss';

type QuickDateOption = 'today' | 'tomorrow' | 'plus2' | 'custom';

const LOOKUP_DEBOUNCE_MS = 350;
const CUTOFF_HOUR = 17;

function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('52')) return digits;
    if (digits.length === 10) return `52${digits}`;
    return digits;
}

function toDateYmd(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function addDays(baseDate: Date, days: number): Date {
    const nextDate = new Date(baseDate);
    nextDate.setDate(baseDate.getDate() + days);
    return nextDate;
}

function getDateFromQuickOption(option: Exclude<QuickDateOption, 'custom'>, now: Date): string {
    if (option === 'today') return toDateYmd(now);
    if (option === 'tomorrow') return toDateYmd(addDays(now, 1));
    return toDateYmd(addDays(now, 2));
}

export function AdminOrderForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [slots, setSlots] = useState<ServiceSlotOption[]>([]);
    const [phone, setPhone] = useState('');
    const [matchedCustomer, setMatchedCustomer] = useState<PhoneCustomerMatch | null>(null);
    const [forceNewCustomer, setForceNewCustomer] = useState(false);
    const [name, setName] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const [street, setStreet] = useState('');
    const [colony, setColony] = useState('');
    const lookupRequestId = useRef(0);

    const initialQuickOption = useMemo<QuickDateOption>(() => {
        const now = new Date();
        return now.getHours() >= CUTOFF_HOUR ? 'tomorrow' : 'today';
    }, []);
    const [quickDateOption, setQuickDateOption] = useState<QuickDateOption>(initialQuickOption);
    const [customDate, setCustomDate] = useState('');
    const todayDisabled = useMemo(() => new Date().getHours() >= CUTOFF_HOUR, []);
    const deliveryDate = useMemo(() => {
        if (quickDateOption === 'custom') {
            return customDate;
        }
        return getDateFromQuickOption(quickDateOption, new Date());
    }, [customDate, quickDateOption]);

    useEffect(() => {
        let mounted = true;
        listServiceSlots()
            .then((slotsRes) => {
                if (!mounted) return;
                if (slotsRes.success) setSlots(slotsRes.slots);
            })
            .catch(() => {
                if (mounted) {
                    setSlots([]);
                }
            });

        return () => {
            mounted = false;
        };
    }, []);

    const runPhoneLookup = useCallback(async (value: string) => {
        const normalized = normalizePhone(value);
        if (!normalized || normalized.length < 10) {
            setMatchedCustomer(null);
            setLookupError(null);
            return;
        }

        const requestId = ++lookupRequestId.current;
        setLookupLoading(true);
        const result = await findCustomerByPhone(value);

        if (requestId !== lookupRequestId.current) return;

        setLookupLoading(false);
        if (!result.success) {
            setLookupError(result.error || 'No se pudo validar el teléfono');
            return;
        }

        setLookupError(null);
        setMatchedCustomer(result.customer || null);
        if (result.customer && !forceNewCustomer && !nameTouched) {
            setName(result.customer.display_name);
        }
    }, [forceNewCustomer, nameTouched]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void runPhoneLookup(phone);
        }, LOOKUP_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [phone, runPhoneLookup]);

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
            name: name.trim(),
            phone: phone.trim(),
            forceNewCustomer,
            volume: parseFloat(formData.get('volume') as string),
            concreteType: formData.get('concreteType') as 'direct' | 'pumped',
            strength: formData.get('strength') as string,
            deliveryAddress: `${street.trim()}, Col. ${colony.trim()}`,
            deliveryDate: deliveryDate || undefined,
            scheduledWindowStart: toIsoOrUndefined(formData.get('scheduledWindowStart')),
            scheduledWindowEnd: toIsoOrUndefined(formData.get('scheduledWindowEnd')),
            scheduledSlotCode: (formData.get('scheduledSlotCode') as string) || undefined,
            externalRef: (formData.get('externalRef') as string) || undefined,
            notes: (formData.get('notes') as string) || undefined,
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
                    <label htmlFor="phone">Teléfono</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        autoFocus
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        onBlur={(event) => void runPhoneLookup(event.target.value)}
                        placeholder="656 000 0000"
                    />
                    {lookupLoading && <small className={styles.helper}>Buscando cliente...</small>}
                    {lookupError && <small className={styles.lookupError}>{lookupError}</small>}
                </div>

                <div className={styles.field}>
                    <label htmlFor="name">Nombre del Cliente</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={name}
                        onChange={(event) => {
                            setName(event.target.value);
                            setNameTouched(true);
                        }}
                        placeholder="Ej. Juan Pérez"
                    />
                </div>

                {matchedCustomer && (
                    <div className={`${styles.customerCard} ${styles.fullWidth}`} role="status">
                        <p>
                            Cliente detectado: <strong>{matchedCustomer.display_name}</strong> ({matchedCustomer.primary_phone_norm})
                        </p>
                        {!forceNewCustomer ? (
                            <button
                                type="button"
                                className={styles.linkButton}
                                onClick={() => setForceNewCustomer(true)}
                            >
                                Crear cliente nuevo de todas formas
                            </button>
                        ) : (
                            <button
                                type="button"
                                className={styles.linkButton}
                                onClick={() => setForceNewCustomer(false)}
                            >
                                Usar cliente detectado
                            </button>
                        )}
                    </div>
                )}

                <div className={styles.field}>
                    <label htmlFor="street">Calle y número</label>
                    <input
                        type="text"
                        id="street"
                        required
                        value={street}
                        onChange={(event) => setStreet(event.target.value)}
                        placeholder="Ej. Av. Principal 123"
                    />
                </div>

                <div className={styles.field}>
                    <label htmlFor="colony">Colonia</label>
                    <input
                        type="text"
                        id="colony"
                        required
                        value={colony}
                        onChange={(event) => setColony(event.target.value)}
                        placeholder="Ej. Campestre"
                    />
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
                    <select id="strength" name="strength" required defaultValue="200">
                        <option value="100">f&apos;c 100</option>
                        <option value="150">f&apos;c 150</option>
                        <option value="200">f&apos;c 200 (predeterminado)</option>
                        <option value="250">f&apos;c 250</option>
                        <option value="300">f&apos;c 300</option>
                    </select>
                </div>

                <div className={styles.field}>
                    <label>Fecha solicitada</label>
                    <div className={styles.quickDates} role="group" aria-label="Fecha solicitada rápida">
                        <button
                            type="button"
                            className={quickDateOption === 'today' ? styles.quickDateActive : styles.quickDateButton}
                            onClick={() => setQuickDateOption('today')}
                            disabled={todayDisabled}
                        >
                            Hoy
                        </button>
                        <button
                            type="button"
                            className={quickDateOption === 'tomorrow' ? styles.quickDateActive : styles.quickDateButton}
                            onClick={() => setQuickDateOption('tomorrow')}
                        >
                            Mañana
                        </button>
                        <button
                            type="button"
                            className={quickDateOption === 'plus2' ? styles.quickDateActive : styles.quickDateButton}
                            onClick={() => setQuickDateOption('plus2')}
                        >
                            +2 días
                        </button>
                        <button
                            type="button"
                            className={quickDateOption === 'custom' ? styles.quickDateActive : styles.quickDateButton}
                            onClick={() => setQuickDateOption('custom')}
                        >
                            Personalizada
                        </button>
                    </div>
                    {quickDateOption === 'custom' && (
                        <input
                            type="date"
                            id="deliveryDate"
                            name="deliveryDate"
                            value={customDate}
                            required
                            onChange={(event) => setCustomDate(event.target.value)}
                        />
                    )}
                    {quickDateOption !== 'custom' && (
                        <input type="hidden" name="deliveryDate" value={deliveryDate} />
                    )}
                    <small className={styles.helper}>Horario solicitado por el cliente (no confirmado).</small>
                </div>

                <div className={styles.field}>
                    <label htmlFor="scheduledSlotCode">Franja solicitada</label>
                    <select id="scheduledSlotCode" name="scheduledSlotCode" defaultValue="" required>
                        <option value="" disabled>Selecciona una franja</option>
                        {slots.map((slot) => (
                            <option key={slot.slot_code} value={slot.slot_code}>
                                {slot.label} ({slot.start_time} - {slot.end_time})
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.field}>
                    <label htmlFor="notes">Nota interna</label>
                    <input id="notes" name="notes" maxLength={180} placeholder="Instrucción rápida para operación..." />
                </div>

                <details className={`${styles.field} ${styles.fullWidth}`}>
                    <summary>Detalles avanzados</summary>
                    <div className={styles.grid}>
                        <div className={styles.field}>
                            <label htmlFor="externalRef">Referencia externa</label>
                            <input id="externalRef" name="externalRef" placeholder="Código interno/ERP" />
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="scheduledWindowStart">Ventana solicitada inicio</label>
                            <input type="datetime-local" id="scheduledWindowStart" name="scheduledWindowStart" />
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="scheduledWindowEnd">Ventana solicitada fin</label>
                            <input type="datetime-local" id="scheduledWindowEnd" name="scheduledWindowEnd" />
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
