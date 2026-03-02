'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateAdminOrder } from '@/app/actions/updateAdminOrder';
import { updateOrderStatus } from '@/app/actions/updateOrderStatus';
import { createOrderPayment } from '@/app/actions/createOrderPayment';
import { cancelAdminOrder } from '@/app/actions/cancelAdminOrder';
import { listServiceSlots } from '@/app/actions/listServiceSlots';
import { updateOrderFiscalData } from '@/app/actions/updateOrderFiscalData';
import type { OrderDetail } from '@/types/internal/order-admin';
import type { DbOrderStatus } from '@/types/database-enums';
import styles from './page.module.scss';

interface OrderDetailClientProps {
    initialData: OrderDetail;
}

const STATUS_OPTIONS: Array<{ value: DbOrderStatus; label: string }> = [
    { value: 'draft', label: 'Borrador' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'scheduled', label: 'Agendado' },
    { value: 'in_progress', label: 'En progreso' },
    { value: 'completed', label: 'Completado' },
    { value: 'cancelled', label: 'Cancelado' },
];

export default function OrderDetailClient({ initialData }: OrderDetailClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [address, setAddress] = useState(initialData.order.delivery_address_text ?? '');
    const [deliveryAddressId, setDeliveryAddressId] = useState(initialData.order.delivery_address_id ?? '');
    const [scheduledDate, setScheduledDate] = useState(initialData.order.scheduled_date ?? '');
    const [slotCode, setSlotCode] = useState(initialData.order.scheduled_slot_code ?? '');
    const [scheduledTimeLabel, setScheduledTimeLabel] = useState(initialData.order.scheduled_time_label ?? '');
    const [scheduledWindowStart, setScheduledWindowStart] = useState(initialData.order.scheduled_window_start ?? '');
    const [scheduledWindowEnd, setScheduledWindowEnd] = useState(initialData.order.scheduled_window_end ?? '');
    const [notes, setNotes] = useState(initialData.order.notes ?? '');
    const [externalRef, setExternalRef] = useState(initialData.order.external_ref ?? '');
    const [legacyProductRaw, setLegacyProductRaw] = useState(initialData.order.legacy_product_raw ?? '');
    const [importSource, setImportSource] = useState(initialData.order.import_source ?? '');
    const [importBatchId, setImportBatchId] = useState(initialData.order.import_batch_id ?? '');
    const [importRowHash, setImportRowHash] = useState(initialData.order.import_row_hash ?? '');
    const [legacyFolioRaw, setLegacyFolioRaw] = useState(initialData.order.legacy_folio_raw ?? '');
    const [utmSource, setUtmSource] = useState(initialData.order.utm_source ?? '');
    const [utmMedium, setUtmMedium] = useState(initialData.order.utm_medium ?? '');
    const [utmCampaign, setUtmCampaign] = useState(initialData.order.utm_campaign ?? '');
    const [status, setStatus] = useState<DbOrderStatus>(initialData.order.order_status);
    const [cancelReason, setCancelReason] = useState('');
    const [slotOptions, setSlotOptions] = useState<Array<{ slot_code: string; label: string }>>([]);
    const [requiresInvoice, setRequiresInvoice] = useState(Boolean(initialData.fiscalData?.requires_invoice));
    const [invoiceNumber, setInvoiceNumber] = useState(initialData.fiscalData?.invoice_number || '');
    const [fiscalRfc, setFiscalRfc] = useState(initialData.fiscalData?.rfc || '');
    const [fiscalRazonSocial, setFiscalRazonSocial] = useState(initialData.fiscalData?.razon_social || '');
    const [fiscalCfdiUse, setFiscalCfdiUse] = useState(initialData.fiscalData?.cfdi_use || '');

    const [paymentDirection, setPaymentDirection] = useState<'in' | 'out'>('in');
    const [paymentKind, setPaymentKind] = useState<'anticipo' | 'abono' | 'liquidacion' | 'ajuste' | 'refund' | 'chargeback'>('abono');
    const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'credito' | 'deposito' | 'otro'>('transferencia');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');

    const totalPaid = useMemo(
        () => initialData.payments
            .filter((payment) => !payment.voided_at)
            .reduce((acc, payment) => acc + (payment.direction === 'in' ? Number(payment.amount_mxn) : -Number(payment.amount_mxn)), 0),
        [initialData.payments]
    );

    function withFeedback(successMessage: string) {
        setError(null);
        setMessage(successMessage);
        startTransition(() => {
            router.refresh();
        });
    }

    async function executeAction(action: () => Promise<{success: boolean; error?: string}>, successMsg: string) {
        setError(null);
        setMessage(null);
        const result = await action();
        if (!result.success) {
            setError(result.error || 'Error al ejecutar la acción');
            return;
        }
        withFeedback(successMsg);
    }

    const handleSaveOperational = () => executeAction(() => updateAdminOrder({
        orderId: initialData.order.id, delivery_address_text: address || null, delivery_address_id: deliveryAddressId || null,
        scheduled_date: scheduledDate || null, scheduled_slot_code: slotCode || null, scheduled_time_label: scheduledTimeLabel || null,
        scheduled_window_start: scheduledWindowStart || null, scheduled_window_end: scheduledWindowEnd || null, notes: notes || null,
        external_ref: externalRef || null, legacy_product_raw: legacyProductRaw || null, import_source: importSource || null,
        import_batch_id: importBatchId || null, import_row_hash: importRowHash || null, legacy_folio_raw: legacyFolioRaw || null,
        utm_source: utmSource || null, utm_medium: utmMedium || null, utm_campaign: utmCampaign || null,
    }), 'Datos operativos actualizados correctamente.');

    const handleSaveFiscal = () => executeAction(() => updateOrderFiscalData({
        orderId: initialData.order.id, requires_invoice: requiresInvoice, invoice_number: invoiceNumber || null,
        rfc: fiscalRfc || null, razon_social: fiscalRazonSocial || null, cfdi_use: fiscalCfdiUse || null,
    }), 'Datos fiscales actualizados correctamente.');

    const handleStatusUpdate = () => executeAction(() => updateOrderStatus({ orderId: initialData.order.id, newStatus: status }), 'Estado del pedido actualizado.');

    const handleCancelOrder = () => {
        executeAction(() => cancelAdminOrder({ orderId: initialData.order.id, reason: cancelReason }), 'Pedido cancelado con éxito.');
        setCancelReason('');
    };

    const handlePaymentSubmit = () => {
        const amount = Number(paymentAmount);
        if (!Number.isFinite(amount) || amount <= 0) return setError('Captura un monto válido.');
        executeAction(() => createOrderPayment({ orderId: initialData.order.id, direction: paymentDirection, kind: paymentKind, method: paymentMethod, amount, notes: paymentNotes || undefined }), 'Pago registrado.');
        setPaymentAmount(''); setPaymentNotes('');
    };

    const attributionExtras = initialData.order.attribution_extra_json as {
        utm_term?: string | null;
        utm_content?: string | null;
        fbclid?: string | null;
        gclid?: string | null;
    };

    useEffect(() => {
        let mounted = true;
        void listServiceSlots().then((result) => {
            if (!mounted || !result.success) return;
            setSlotOptions(result.slots.map((slot) => ({ slot_code: slot.slot_code, label: slot.label })));
        });
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className={styles.wrapper}>
            {(message || error) && (
                <div className={message ? styles.toastSuccess : styles.toastError} role="status" aria-live="polite">
                    {message || error}
                </div>
            )}

            <section className={styles.section}>
                <h2>Resumen</h2>
                <div className={styles.grid}>
                    <p><strong>Estatus:</strong> {initialData.order.order_status}</p>
                    <p><strong>Pago:</strong> {initialData.order.payment_status}</p>
                    <p><strong>Total:</strong> ${Number(initialData.order.total_with_vat || 0).toLocaleString('es-MX')}</p>
                    <p><strong>Saldo:</strong> ${Number(initialData.order.balance_amount || 0).toLocaleString('es-MX')}</p>
                    <p><strong>Pagado (ledger):</strong> ${totalPaid.toLocaleString('es-MX')}</p>
                    <p><strong>M3:</strong> {Number(initialData.order.quantity_m3 || 0).toLocaleString('es-MX')}</p>
                </div>
            </section>

            <section className={styles.section}>
                <h2>Cliente y contacto</h2>
                <div className={styles.grid}>
                    <p><strong>Cliente:</strong> {initialData.customer?.display_name || 'Sin vincular'}</p>
                    <p><strong>Customer ID:</strong> {initialData.order.customer_id || 'Sin vincular'}</p>
                    <p><strong>Teléfono:</strong> {initialData.customer?.primary_phone_norm || '-'}</p>
                    <p><strong>Lead origen:</strong> {initialData.order.lead_id || 'Sin lead'}</p>
                    <p><strong>Visitor ID:</strong> {initialData.order.visitor_id || 'Sin visitor'}</p>
                    <p><strong>Vendedor:</strong> {initialData.order.seller_id || 'Sin asignar'}</p>
                </div>
            </section>

            <section className={styles.section}>
                <h2>Origen y atribución</h2>
                <div className={styles.grid}>
                    {[
                        ['UTM Source', utmSource || 'direct'],
                        ['UTM Medium', utmMedium || '-'],
                        ['UTM Campaign', utmCampaign || '-'],
                        ['UTM Term', attributionExtras.utm_term || '-'],
                        ['UTM Content', attributionExtras.utm_content || '-'],
                        ['FBCLID', attributionExtras.fbclid || '-'],
                        ['GCLID', attributionExtras.gclid || '-'],
                    ].map(([l, v]) => <p key={l}><strong>{l}:</strong> {v}</p>)}
                </div>
            </section>

            <section className={styles.section}>
                <h2>Editar datos operativos</h2>
                <div className={styles.formGrid}>
                    <label>
                        Dirección de entrega
                        <input value={address} onChange={(event) => setAddress(event.target.value)} />
                    </label>
                    <label>
                        ID de dirección
                        <input value={deliveryAddressId} onChange={(event) => setDeliveryAddressId(event.target.value)} />
                    </label>
                    <label>
                        Fecha de entrega
                        <input type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} />
                    </label>
                    <label>
                        Código de franja
                        <select value={slotCode} onChange={(event) => setSlotCode(event.target.value)}>
                            <option value="">Sin franja asignada</option>
                            {slotOptions.map((slot) => (
                                <option key={slot.slot_code} value={slot.slot_code}>{slot.label}</option>
                            ))}
                        </select>
                    </label>
                    <p><strong>Franja actual:</strong> {initialData.serviceSlot?.label || 'Sin franja asignada'}</p>
                    <label>
                        Etiqueta horaria
                        <input value={scheduledTimeLabel} onChange={(event) => setScheduledTimeLabel(event.target.value)} />
                    </label>
                    <label>
                        Ventana inicio
                        <input value={scheduledWindowStart} onChange={(event) => setScheduledWindowStart(event.target.value)} />
                    </label>
                    <label>
                        Ventana fin
                        <input value={scheduledWindowEnd} onChange={(event) => setScheduledWindowEnd(event.target.value)} />
                    </label>
                    <label>
                        Referencia externa
                        <input value={externalRef} onChange={(event) => setExternalRef(event.target.value)} />
                    </label>
                    <label>
                        Notas
                        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
                    </label>
                </div>
                <button type="button" className={styles.button} onClick={handleSaveOperational} disabled={isPending}>
                    {isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
            </section>

            <section className={styles.section}>
                <h2>Datos fiscales</h2>
                <div className={styles.formGrid}>
                    <label className={styles.alignCenter}>
                        <input type="checkbox" checked={requiresInvoice} onChange={(event) => setRequiresInvoice(event.target.checked)} />
                        Requiere factura
                    </label>
                    <label>
                        RFC
                        <input value={fiscalRfc} onChange={(event) => setFiscalRfc(event.target.value)} />
                    </label>
                    <label>
                        Razón social
                        <input value={fiscalRazonSocial} onChange={(event) => setFiscalRazonSocial(event.target.value)} />
                    </label>
                    <label>
                        Uso CFDI
                        <input value={fiscalCfdiUse} onChange={(event) => setFiscalCfdiUse(event.target.value)} />
                    </label>
                    <label>
                        No. factura
                        <input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} />
                    </label>
                </div>
                <button type="button" className={styles.button} onClick={handleSaveFiscal} disabled={isPending}>
                    Guardar fiscal
                </button>
            </section>

            <section className={styles.section}>
                <h2>Metadatos avanzados</h2>
                <div className={styles.formGrid}>
                    {[
                        { label: 'Producto legado (texto)', value: legacyProductRaw, setter: setLegacyProductRaw },
                        { label: 'Origen de importación', value: importSource, setter: setImportSource },
                        { label: 'Lote de importación', value: importBatchId, setter: setImportBatchId },
                        { label: 'Hash de fila importada', value: importRowHash, setter: setImportRowHash },
                        { label: 'Folio legado', value: legacyFolioRaw, setter: setLegacyFolioRaw },
                        { label: 'UTM Source', value: utmSource, setter: setUtmSource },
                        { label: 'UTM Medium', value: utmMedium, setter: setUtmMedium },
                        { label: 'UTM Campaign', value: utmCampaign, setter: setUtmCampaign },
                    ].map(({ label, value, setter }) => (
                        <label key={label}>
                            {label}
                            <input value={value} onChange={(event) => setter(event.target.value)} />
                        </label>
                    ))}
                </div>
            </section>

            <section className={styles.section}>
                <h2>Transición de estado</h2>
                <div className={styles.inlineRow}>
                    <label>
                        Nuevo estado
                        <select value={status} onChange={(event) => setStatus(event.target.value as DbOrderStatus)}>
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </label>
                    <button type="button" className={styles.button} onClick={handleStatusUpdate} disabled={isPending}>
                        Actualizar estado
                    </button>
                </div>
            </section>

            <section className={styles.section}>
                <h2>Registrar pago</h2>
                <div className={styles.formGrid}>
                    <label>
                        Dirección
                        <select value={paymentDirection} onChange={(event) => setPaymentDirection(event.target.value as 'in' | 'out')}>
                            {[['in', 'Entrada'], ['out', 'Salida']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </label>
                    <label>
                        Tipo
                        <select value={paymentKind} onChange={(event) => setPaymentKind(event.target.value as typeof paymentKind)}>
                            {[['anticipo', 'Anticipo'], ['abono', 'Abono'], ['liquidacion', 'Liquidación'], ['ajuste', 'Ajuste'], ['refund', 'Reembolso'], ['chargeback', 'Contracargo']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </label>
                    <label>
                        Método
                        <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)}>
                            {[['transferencia', 'Transferencia'], ['efectivo', 'Efectivo'], ['credito', 'Crédito'], ['deposito', 'Depósito'], ['otro', 'Otro']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </label>
                    <label>
                        Monto
                        <input type="number" min="0" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} />
                    </label>
                    <label>
                        Notas del pago
                        <textarea value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} rows={2} />
                    </label>
                </div>
                <button type="button" className={styles.button} onClick={handlePaymentSubmit} disabled={isPending}>
                    Registrar pago
                </button>
            </section>

            <section className={styles.section}>
                <h2>Pagos registrados</h2>
                <ul className={styles.timeline}>
                    {initialData.payments.map((payment) => (
                        <li key={payment.id}>
                            <strong>{payment.kind}</strong> · {payment.method} · ${Number(payment.amount_mxn).toLocaleString('es-MX')} · {new Date(payment.paid_at).toLocaleString('es-MX')}
                        </li>
                    ))}
                    {initialData.payments.length === 0 && <li>No hay pagos registrados.</li>}
                </ul>
            </section>

            <section className={styles.section}>
                <h2>Historial de estado</h2>
                <ul className={styles.timeline}>
                    {initialData.statusHistory.map((item) => (
                        <li key={item.id}>
                            {item.from_status || 'inicio'} → <strong>{item.to_status}</strong> · {new Date(item.changed_at).toLocaleString('es-MX')}
                            {item.reason ? ` · ${item.reason}` : ''}
                        </li>
                    ))}
                    {initialData.statusHistory.length === 0 && <li>Sin historial de cambios.</li>}
                </ul>
            </section>

            <section className={styles.sectionDanger}>
                <h2>Cancelar pedido</h2>
                <p>Esta acción preserva el pedido para auditoría y cambia su estado a cancelado.</p>
                <label>
                    Motivo de cancelación
                    <textarea
                        value={cancelReason}
                        onChange={(event) => setCancelReason(event.target.value)}
                        rows={3}
                        placeholder="Describe la razón de cancelación"
                    />
                </label>
                <button type="button" className={styles.dangerButton} onClick={handleCancelOrder} disabled={isPending}>
                    Confirmar cancelación
                </button>
            </section>
        </div>
    );
}
