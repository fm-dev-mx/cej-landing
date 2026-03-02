'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAdminOrder, type AdminOrderPayload } from '@/app/actions/createAdminOrder';
import { adminOrderPayloadSchema } from '@/lib/schemas/internal/order';
import { findCustomerByPhone, type PhoneCustomerMatch } from '@/app/actions/findCustomerByPhone';
import { listServiceSlots } from '@/app/actions/listServiceSlots';
import type { ServiceSlotOption } from '@/types/internal/order-admin';
import styles from './page.module.scss';

import {
    formatPhone,
    getDateFromQuickOption,
    normalizePhone,
    stripPhone,
    CUTOFF_HOUR,
    LOOKUP_DEBOUNCE_MS,
    type QuickDateOption
} from './utils';


export function AdminOrderForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [isInternational, setIsInternational] = useState(false);
    const [matchedCustomer, setMatchedCustomer] = useState<PhoneCustomerMatch | null>(null);
    const [forceNewCustomer, setForceNewCustomer] = useState(false);
    const [name, setName] = useState('');
    const [nameTouched, setNameTouched] = useState(false);
    const [street, setStreet] = useState('');
    const [colony, setColony] = useState('');
    const [timeWindow, setTimeWindow] = useState('');
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
        setFormErrors({});

        const formData = new FormData(e.currentTarget);
        const rawPhone = stripPhone(phone);
        const finalPhone = isInternational && rawPhone ? `1${rawPhone}` : rawPhone;

        const payload = {
            name: name.trim(),
            phone: finalPhone,
            forceNewCustomer,
            volume: parseFloat(formData.get('volume') as string) || 0,
            concreteType: formData.get('concreteType') as 'direct' | 'pumped',
            strength: formData.get('strength') as string,
            deliveryAddress: `${street.trim()}, Col. ${colony.trim()}`,
            deliveryDate: deliveryDate || undefined,
            scheduledTimeLabel: timeWindow || undefined,
            externalRef: (formData.get('externalRef') as string) || undefined,
            notes: (formData.get('notes') as string) || undefined,
        };

        const parsed = adminOrderPayloadSchema.safeParse(payload);
        if (!parsed.success) {
            const errors: Record<string, string> = {};
            parsed.error.errors.forEach((err) => {
                const path = err.path[0];
                if (path) errors[path.toString()] = err.message;
            });
            setFormErrors(errors);
            setLoading(false);

            // Auto-scroll to first error
            const firstErrorField = parsed.error.errors[0]?.path[0]?.toString();
            if (firstErrorField) {
                setTimeout(() => {
                    const mappedName = ['deliveryAddress'].includes(firstErrorField) ? 'street' : firstErrorField;
                    const el = document.querySelector(`[name="${mappedName}"]`) as HTMLElement;
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.focus();
                    }
                }, 50);
            }
            return;
        }

        const result = await createAdminOrder(parsed.data);

        if (result.status === 'success') {
            router.push(`/dashboard/orders/${result.id}`);
            router.refresh();
            return;
        }

        setError(result.message);
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.grid}>
                <div className={styles.field}>
                    <label htmlFor="phone">Teléfono</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        autoFocus
                        value={phone}
                        onChange={(event) => setPhone(formatPhone(event.target.value, isInternational))}
                        onBlur={(event) => void runPhoneLookup(event.target.value)}
                        placeholder={isInternational ? "+1 (915) 000-0000" : "(656) 000-0000"}
                        className={formErrors.phone ? styles.inputError : ''}
                    />
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={isInternational}
                            onChange={(e) => {
                                setIsInternational(e.target.checked);
                                setPhone(formatPhone(phone, e.target.checked));
                            }}
                        />
                        Habilitar número internacional (+1)
                    </label>
                    {formErrors.phone && <span className={styles.fieldError}>{formErrors.phone}</span>}
                    {lookupLoading && <small className={styles.helper}>Buscando cliente...</small>}
                    {lookupError && <small className={styles.lookupError}>{lookupError}</small>}
                </div>

                <div className={styles.field}>
                    <label htmlFor="name">Nombre del Cliente</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={name}
                        onChange={(event) => {
                            setName(event.target.value);
                            setNameTouched(true);
                            setFormErrors(prev => ({ ...prev, name: '' }));
                        }}
                        placeholder="Ej. Juan Pérez"
                        className={formErrors.name ? styles.inputError : ''}
                    />
                    {formErrors.name && <span className={styles.fieldError}>{formErrors.name}</span>}
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
                        name="street"
                        value={street}
                        onChange={(event) => {
                            setStreet(event.target.value);
                            setFormErrors(prev => ({ ...prev, deliveryAddress: '' }));
                        }}
                        placeholder="Ej. Av. Principal 123"
                        className={formErrors.deliveryAddress ? styles.inputError : ''}
                    />
                </div>

                <div className={styles.field}>
                    <label htmlFor="colony">Colonia</label>
                    <input
                        type="text"
                        id="colony"
                        name="colony"
                        value={colony}
                        onChange={(event) => {
                            setColony(event.target.value);
                            setFormErrors(prev => ({ ...prev, deliveryAddress: '' }));
                        }}
                        placeholder="Ej. Campestre"
                        className={formErrors.deliveryAddress ? styles.inputError : ''}
                    />
                    {formErrors.deliveryAddress && <span className={styles.fieldError}>{formErrors.deliveryAddress}</span>}
                </div>

                <div className={styles.field}>
                    <label htmlFor="volume">Volumen (m³)</label>
                    <input
                        type="number"
                        id="volume"
                        name="volume"
                        step="0.5"
                        min="1"
                        placeholder="Ej. 5.5"
                        className={formErrors.volume ? styles.inputError : ''}
                    />
                    {formErrors.volume && <span className={styles.fieldError}>{formErrors.volume}</span>}
                </div>

                <div className={styles.field}>
                    <label htmlFor="concreteType">Tipo de Servicio</label>
                    <select id="concreteType" name="concreteType" defaultValue="direct">
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
                    <small className={styles.helper}>La fecha exacta de entrega se confirmará 24 horas antes.</small>
                </div>

                <div className={styles.field}>
                    <label>Ventana de Entrega (Preferida)</label>
                    <div className={styles.quickDates} role="group" aria-label="Ventana de entrega">
                        {[
                            { label: '7:00 AM - 10:00 AM', value: '7:00 AM - 10:00 AM' },
                            { label: '10:00 AM - 12:00 PM', value: '10:00 AM - 12:00 PM' },
                            { label: '12:00 PM - 2:00 PM', value: '12:00 PM - 2:00 PM' },
                            { label: '2:00 PM - 5:00 PM', value: '2:00 PM - 5:00 PM' }
                        ].map((w) => (
                            <button
                                key={w.value}
                                type="button"
                                className={timeWindow === w.value ? styles.quickDateActive : styles.quickDateButton}
                                onClick={() => {
                                    setTimeWindow(w.value);
                                    setFormErrors(prev => ({ ...prev, scheduledTimeLabel: '' }));
                                }}
                            >
                                {w.label}
                            </button>
                        ))}
                    </div>
                    <input type="hidden" name="scheduledTimeLabel" value={timeWindow} />
                    {formErrors.scheduledTimeLabel && <span className={styles.fieldError}>{formErrors.scheduledTimeLabel}</span>}
                    <small className={styles.helper}>La hora exacta de entrega se confirmará 24 horas antes con el cliente.</small>
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
