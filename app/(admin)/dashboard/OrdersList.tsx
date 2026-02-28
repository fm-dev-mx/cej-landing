'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getMyOrders, type OrderSummary } from '@/app/actions/getMyOrders';
import styles from './OrdersList.module.scss';

interface OrdersListProps {
    orders: OrderSummary[];
    nextCursor?: string | null;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    new: { label: 'Nuevo', className: 'statusNew' },
    confirmed: { label: 'Confirmado', className: 'statusConfirmed' },
    scheduled: { label: 'Programado', className: 'statusScheduled' },
    in_transit: { label: 'En Tránsito', className: 'statusTransit' },
    delivered: { label: 'Entregado', className: 'statusDelivered' },
    invoiced: { label: 'Facturado', className: 'statusInvoiced' },
    paid: { label: 'Pagado', className: 'statusPaid' },
    cancelled: { label: 'Cancelado', className: 'statusCancelled' },
    expired: { label: 'Expirado', className: 'statusExpired' },
    // Legacy support
    draft: { label: 'Borrador', className: 'statusNew' },
    pending_payment: { label: 'Pendiente', className: 'statusTransit' },
};

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function formatCurrency(amount: number, currency: string = 'MXN'): string {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency,
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
                    const status = STATUS_LABELS[order.status] || { label: order.status, className: '' };
                    const itemCount = order.items?.length || 0;

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
                                        📅 {formatDate(order.created_at)}
                                    </span>
                                    <span className={styles.items}>
                                        📦 {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                    </span>
                                </div>

                                <div className={styles.total}>
                                    {formatCurrency(order.total_amount, order.currency)}
                                </div>
                            </div>

                            <div className={styles.cardActions}>
                                <Link
                                    href={`/cotizacion/${order.folio}`}
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
