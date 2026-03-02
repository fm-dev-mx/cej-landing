'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateAdminOrder } from '@/app/actions/updateAdminOrder';
import { updateOrderStatus } from '@/app/actions/updateOrderStatus';
import { createOrderPayment } from '@/app/actions/createOrderPayment';
import { cancelAdminOrder } from '@/app/actions/cancelAdminOrder';
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
    const [scheduledDate, setScheduledDate] = useState(initialData.order.scheduled_date ?? '');
    const [slotCode, setSlotCode] = useState(initialData.order.scheduled_slot_code ?? '');
    const [notes, setNotes] = useState(initialData.order.notes ?? '');
    const [externalRef, setExternalRef] = useState(initialData.order.external_ref ?? '');
    const [status, setStatus] = useState<DbOrderStatus>(initialData.order.order_status);
    const [cancelReason, setCancelReason] = useState('');

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

    async function handleSaveOperational() {
        setError(null);
        setMessage(null);
        const result = await updateAdminOrder({
            orderId: initialData.order.id,
            delivery_address_text: address || null,
            scheduled_date: scheduledDate || null,
            scheduled_slot_code: slotCode || null,
            notes: notes || null,
            external_ref: externalRef || null,
        });

        if (!result.success) {
            setError(result.error || 'No se pudo actualizar');
            return;
        }

        withFeedback('Datos operativos actualizados correctamente.');
    }

    async function handleStatusUpdate() {
        setError(null);
        setMessage(null);
        const result = await updateOrderStatus({ orderId: initialData.order.id, newStatus: status });
        if (!result.success) {
            setError(result.error || 'No se pudo cambiar el estado');
            return;
        }

        withFeedback('Estado del pedido actualizado.');
    }

    async function handlePaymentSubmit() {
        setError(null);
        setMessage(null);

        const amount = Number(paymentAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            setError('Captura un monto válido para registrar el pago.');
            return;
        }

        const result = await createOrderPayment({
            orderId: initialData.order.id,
            direction: paymentDirection,
            kind: paymentKind,
            method: paymentMethod,
            amount,
            notes: paymentNotes || undefined,
        });

        if (!result.success) {
            setError(result.error || 'No se pudo registrar el pago');
            return;
        }

        setPaymentAmount('');
        setPaymentNotes('');
        withFeedback('Pago registrado.');
    }

    async function handleCancelOrder() {
        setError(null);
        setMessage(null);

        const result = await cancelAdminOrder({
            orderId: initialData.order.id,
            reason: cancelReason,
        });

        if (!result.success) {
            setError(result.error || 'No se pudo cancelar el pedido');
            return;
        }

        setCancelReason('');
        withFeedback('Pedido cancelado con éxito.');
    }

    const attributionExtras = initialData.order.attribution_extra_json as {
        utm_term?: string | null;
        utm_content?: string | null;
        fbclid?: string | null;
        gclid?: string | null;
    };

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
                    <p><strong>UTM Source:</strong> {initialData.order.utm_source || 'direct'}</p>
                    <p><strong>UTM Medium:</strong> {initialData.order.utm_medium || '-'}</p>
                    <p><strong>UTM Campaign:</strong> {initialData.order.utm_campaign || '-'}</p>
                    <p><strong>UTM Term:</strong> {attributionExtras.utm_term || '-'}</p>
                    <p><strong>UTM Content:</strong> {attributionExtras.utm_content || '-'}</p>
                    <p><strong>FBCLID:</strong> {attributionExtras.fbclid || '-'}</p>
                    <p><strong>GCLID:</strong> {attributionExtras.gclid || '-'}</p>
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
                        Fecha de entrega
                        <input type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} />
                    </label>
                    <label>
                        Código de franja
                        <input value={slotCode} onChange={(event) => setSlotCode(event.target.value)} placeholder="Ej. AM-01" />
                    </label>
                    <p><strong>Franja actual:</strong> {initialData.serviceSlot?.label || 'Sin franja asignada'}</p>
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
                            <option value="in">Entrada</option>
                            <option value="out">Salida</option>
                        </select>
                    </label>
                    <label>
                        Tipo
                        <select value={paymentKind} onChange={(event) => setPaymentKind(event.target.value as typeof paymentKind)}>
                            <option value="anticipo">Anticipo</option>
                            <option value="abono">Abono</option>
                            <option value="liquidacion">Liquidación</option>
                            <option value="ajuste">Ajuste</option>
                            <option value="refund">Reembolso</option>
                            <option value="chargeback">Contracargo</option>
                        </select>
                    </label>
                    <label>
                        Método
                        <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)}>
                            <option value="transferencia">Transferencia</option>
                            <option value="efectivo">Efectivo</option>
                            <option value="credito">Crédito</option>
                            <option value="deposito">Depósito</option>
                            <option value="otro">Otro</option>
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
