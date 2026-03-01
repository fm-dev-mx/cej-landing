'use client';

import { useState } from 'react';
import { getMyOrders } from '@/app/actions/getMyOrders';
import type { OrderSummary } from '@/types/internal/order';
import Link from 'next/link';
import styles from './OrdersList.module.scss';

interface OrdersListProps {
    orders: OrderSummary[];
    nextCursor?: string | null;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    draft: { label: 'Borrador', className: 'statusNew' },
    confirmed: { label: 'Confirmado', className: 'statusConfirmed' },
    scheduled: { label: 'Programado', className: 'statusScheduled' },
    in_progress: { label: 'En Progreso', className: 'statusTransit' },
    completed: { label: 'Completado', className: 'statusDelivered' },
    cancelled: { label: 'Cancelado', className: 'statusCancelled' },
};

const PAYMENT_LABELS: Record<string, string> = {
    pending: 'Pendiente',
    partial: 'Parcial',
    paid: 'Pagado',
    overpaid: 'Excedente',
};

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    }).format(amount);
}

export function OrdersList({ orders: initialOrders, nextCursor: initialCursor }: OrdersListProps) {
    const [orders, setOrders] = useState<OrderSummary[]>(initialOrders);
    const [cursor, setCursor] = useState<string | null | undefined>(initialCursor);
    const [loading, setLoading] = useState(false);

    const handleLoadMore = async () => {
        if (!cursor || loading) return;

        setLoading(true);
        try {
            const result = await getMyOrders(cursor);
            if (result.success) {
                setOrders((prev) => [...prev, ...result.orders]);
                setCursor(result.nextCursor);
            }
        } catch (err) {
            console.error('Failed to load more orders', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className={styles.list}>
                {orders.map((order) => {
                    const status = STATUS_LABELS[order.order_status] || { label: order.order_status, className: '' };
                    const payStatus = PAYMENT_LABELS[order.payment_status] || order.payment_status;

                    return (
                        <article key={order.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <span className={styles.folio}>{order.folio}</span>
                                <span className={`${styles.status} ${styles[status.className]}`}>
                                    {status.label}
                                </span>
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.info}>
                                    <span className={styles.date}>
                                        📅 {formatDate(order.ordered_at)}
                                    </span>
                                    <span className={styles.payment}>
                                        💰 {payStatus}
                                    </span>
                                </div>

                                <div className={styles.totalContainer}>
                                    <div className={styles.totalLabel}>Total</div>
                                    <div className={styles.totalValue}>
                                        {formatCurrency(order.total_with_vat)}
                                    </div>
                                    {order.balance_amount > 0 && (
                                        <div className={styles.balance}>
                                            Saldo: {formatCurrency(order.balance_amount)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.cardActions}>
                                <Link
                                    href={`/dashboard/orders?folio=${order.folio}`}
                                    className={styles.viewButton}
                                >
                                    Ver Detalles
                                </Link>
                            </div>
                        </article>
                    );
                })}
            </div>

            {cursor && (
                <div className={styles.pagination}>
                    <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className={styles.loadMoreButton}
                    >
                        {loading ? 'Cargando...' : 'Cargar más pedidos'}
                    </button>
                </div>
            )}
        </>
    );
}
