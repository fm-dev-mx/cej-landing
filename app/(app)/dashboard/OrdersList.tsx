'use client';

import Link from 'next/link';
import type { OrderSummary } from '@/app/actions/getMyOrders';
import styles from './OrdersList.module.scss';

interface OrdersListProps {
    orders: OrderSummary[];
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    draft: { label: 'Borrador', className: 'statusDraft' },
    pending_payment: { label: 'Pendiente de Pago', className: 'statusPending' },
    scheduled: { label: 'Programado', className: 'statusScheduled' },
    delivered: { label: 'Entregado', className: 'statusDelivered' },
    cancelled: { label: 'Cancelado', className: 'statusCancelled' },
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

export function OrdersList({ orders }: OrdersListProps) {
    return (
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
                            <button
                                type="button"
                                className={styles.reorderButton}
                                onClick={() => {
                                    // TODO: Implement reorder flow
                                    console.log('Reorder:', order.folio);
                                }}
                            >
                                Reordenar
                            </button>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
