'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAdminOrder } from '@/app/actions/createAdminOrder';
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
    extractOrderPayload, TRACKING_FIELDS, type QuickDateOption
} from './utils';

interface AdminOrderFormProps {
    initialName?: string;
    initialPhone?: string;
    initialLeadId?: string;
    initialDeliveryAddress?: string;
}

export function AdminOrderForm({
    initialName = '',
    initialPhone = '',
    initialLeadId,
    initialDeliveryAddress = '',
}: AdminOrderFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [phone, setPhone] = useState(initialPhone);
    const [isInternational, setIsInternational] = useState(false);
    const [matchedCustomer, setMatchedCustomer] = useState<PhoneCustomerMatch | null>(null);
    const [forceNewCustomer, setForceNewCustomer] = useState(false);
    const [name, setName] = useState(initialName);
    const [nameTouched, setNameTouched] = useState(false);
    const [street, setStreet] = useState(initialDeliveryAddress);
    const [colony, setColony] = useState('');
    const [serviceSlots, setServiceSlots] = useState<ServiceSlotOption[]>([]);
    const [selectedSlotCode, setSelectedSlotCode] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
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

    useEffect(() => {
        let mounted = true;
        void listServiceSlots().then((result) => {
            if (!mounted || !result.success) return;
            setServiceSlots(result.slots);
            if (result.slots.length > 0) {
                setSelectedSlotCode(result.slots[0].slot_code);
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
        setFormErrors({});

        const formData = new FormData(e.currentTarget);
        const rawPhone = stripPhone(phone);
        const finalPhone = isInternational && rawPhone ? `1${rawPhone}` : rawPhone;

        const payload = extractOrderPayload(formData, {
            name: name.trim(),
            phone: finalPhone,
            forceNewCustomer,
            deliveryAddress: `${street.trim()}, Col. ${colony.trim()}`,
            deliveryDate: deliveryDate || undefined,
            scheduledSlotCode: selectedSlotCode || undefined,
        });

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

                {[
                    { id: 'street', label: 'Calle y número', value: street, setter: setStreet, ph: 'Ej. Av. Principal 123' },
                    { id: 'colony', label: 'Colonia', value: colony, setter: setColony, ph: 'Ej. Campestre' },
                ].map(({ id, label, value, setter, ph }) => (
                    <div key={id} className={styles.field}>
                        <label htmlFor={id}>{label}</label>
                        <input
                            type="text"
                            id={id}
                            name={id}
                            value={value}
                            onChange={(e) => {
                                setter(e.target.value);
                                setFormErrors((prev) => ({ ...prev, deliveryAddress: '' }));
                            }}
                            placeholder={ph}
                            className={formErrors.deliveryAddress ? styles.inputError : ''}
                        />
                        {id === 'colony' && formErrors.deliveryAddress && <span className={styles.fieldError}>{formErrors.deliveryAddress}</span>}
                    </div>
                ))}

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
                        {['100', '150', '200', '250', '300'].map(v => <option key={v} value={v}>f&apos;c {v}{v === '200' ? ' (predeterminado)' : ''}</option>)}
                    </select>
                </div>

                <div className={styles.field}>
                    <label>Fecha solicitada</label>
                    <div className={styles.quickDates} role="group" aria-label="Fecha solicitada rápida">
                        {[
                            { id: 'today', title: 'Hoy', disabled: todayDisabled },
                            { id: 'tomorrow', title: 'Mañana' },
                            { id: 'plus2', title: '+2 días' },
                            { id: 'custom', title: 'Personalizada' },
                        ].map(({ id, title, disabled }) => (
                            <button
                                key={id}
                                type="button"
                                className={quickDateOption === id ? styles.quickDateActive : styles.quickDateButton}
                                onClick={() => setQuickDateOption(id as QuickDateOption)}
                                disabled={disabled}
                            >
                                {title}
                            </button>
                        ))}
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
                    <label htmlFor="scheduledSlotCode">Franja de entrega</label>
                    <select
                        id="scheduledSlotCode"
                        name="scheduledSlotCode"
                        value={selectedSlotCode}
                        onChange={(event) => setSelectedSlotCode(event.target.value)}
                    >
                        <option value="">Sin franja asignada</option>
                        {serviceSlots.map((slot) => (
                            <option key={slot.slot_code} value={slot.slot_code}>
                                {slot.label}
                            </option>
                        ))}
                    </select>
                    <small className={styles.helper}>La hora exacta de entrega se confirma con la franja seleccionada.</small>
                </div>

                <div className={styles.field}>
                    <label htmlFor="notes">Nota interna</label>
                    <input id="notes" name="notes" maxLength={180} placeholder="Instrucción rápida para operación..." />
                </div>

                <div className={`${styles.field} ${styles.fullWidth}`}>
                    <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() => setShowAdvanced((value) => !value)}
                    >
                        {showAdvanced ? 'Ocultar detalles avanzados' : 'Mostrar detalles avanzados'}
                    </button>
                    {showAdvanced && (
                    <div className={styles.grid}>
                        {initialLeadId && (
                            <div className={styles.field}>
                                <label htmlFor="leadId">Lead origen (referencia)</label>
                                <input id="leadId" name="leadId" defaultValue={initialLeadId} disabled />
                            </div>
                        )}
                        {[
                            { id: 'externalRef', label: 'Referencia externa', placeholder: 'Código interno/ERP' },
                            { id: 'legacyFolioRaw', label: 'Folio legado', placeholder: 'Folio histórico' },
                            ...TRACKING_FIELDS
                        ].map((props: { id: string, label: string, placeholder?: string }) => (
                            <div key={props.id} className={styles.field}>
                                <label htmlFor={props.id}>{props.label}</label>
                                <input id={props.id} name={props.id} placeholder={props.placeholder} />
                            </div>
                        ))}
                    </div>
                    )}
                </div>
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
