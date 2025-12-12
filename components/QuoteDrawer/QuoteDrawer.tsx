'use client';

import { useState } from 'react';
import { useCejStore } from '@/store/useCejStore';
import { type CartItem } from '@/types/domain';
import { fmtMXN } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import { LeadFormModal } from '@/components/Calculator/modals/LeadFormModal';
import styles from './QuoteDrawer.module.scss';

export default function QuoteDrawer() {
    const {
        isDrawerOpen, setDrawerOpen,
        activeTab, setActiveTab,
        isProcessingOrder,

        cart, history,
        removeFromCart, editCartItem, loadQuote,
        submittedQuote,
    } = useCejStore();

    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

    if (!isDrawerOpen) return null;

    const listData = activeTab === 'order' ? cart : history;
    const cartTotal = cart.reduce((sum, item) => sum + item.results.total, 0);

    const handleEdit = (id: string) => {
        editCartItem(id);
    };

    const handleClone = (item: CartItem) => {
        loadQuote(item);
    };

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString('es-MX', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    // Phase 0 Bugfix: Show loading state instead of empty state during processing
    const showLoading = isProcessingOrder && activeTab === 'order' && cart.length === 0;
    // Also check if we just submitted - cart might be empty but quote exists
    const justSubmitted = submittedQuote && activeTab === 'order' && cart.length === 0;

    return (
        <>
            <div className={styles.backdrop} onClick={() => setDrawerOpen(false)} aria-hidden="true" />

            <aside className={styles.drawer}>
                <header className={styles.header}>
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === 'order' ? styles.active : ''}`}
                            onClick={() => setActiveTab('order')}
                        >
                            Pedido ({cart.length})
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            Historial
                        </button>
                    </div>
                    <button className={styles.closeBtn} onClick={() => setDrawerOpen(false)}>×</button>
                </header>

                <div className={styles.body}>
                    {showLoading ? (
                        <div className={styles.emptyState}>
                            <p>Procesando tu pedido...</p>
                        </div>
                    ) : justSubmitted ? (
                        <div className={styles.emptyState}>
                            <p>✅ Cotización generada: {submittedQuote.folio}</p>
                            <p>Regresa a la calculadora para ver el ticket.</p>
                            <button onClick={() => setDrawerOpen(false)} className={styles.linkBtn}>
                                Ver ticket
                            </button>
                        </div>
                    ) : listData.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>
                                {activeTab === 'order'
                                    ? 'Tu pedido está vacío.'
                                    : 'Aquí aparecerán tus cálculos recientes.'}
                            </p>
                            {activeTab === 'order' && (
                                <button onClick={() => setDrawerOpen(false)} className={styles.linkBtn}>
                                    Volver a cotizar
                                </button>
                            )}
                        </div>
                    ) : (
                        <ul className={styles.list}>
                            {listData.map((item) => (
                                <li key={item.id} className={styles.item}>
                                    <div className={styles.itemHeader}>
                                        <span className={styles.itemTitle}>
                                            {item.config.label}
                                        </span>
                                        <span className={styles.itemDate}>
                                            {formatDate(item.timestamp)}
                                        </span>
                                    </div>

                                    <div className={styles.itemDetails}>
                                        <div className={styles.detailBadge}>
                                            {item.results.volume.billedM3.toFixed(2)} m³
                                        </div>
                                        <div className={styles.detailBadge}>
                                            {item.results.concreteType === 'pumped' ? 'Bomba' : 'Directo'}
                                        </div>
                                        {item.customer && (
                                            <div className={styles.detailBadgeCustomer}>
                                                👤 {item.customer.name}
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.itemFooter}>
                                        <span className={styles.itemPrice}>{fmtMXN(item.results.total)}</span>

                                        <div className={styles.itemActions}>
                                            {activeTab === 'order' ? (
                                                <>
                                                    <button
                                                        className={styles.textBtnPrimary}
                                                        onClick={() => handleEdit(item.id)}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        className={styles.textBtnDanger}
                                                        onClick={() => removeFromCart(item.id)}
                                                    >
                                                        Borrar
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    className={styles.textBtnPrimary}
                                                    onClick={() => handleClone(item)}
                                                >
                                                    ↺ Reutilizar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {activeTab === 'order' && cart.length > 0 && (
                    <footer className={styles.footer}>
                        <div className={styles.totalRow}>
                            <span>Total Estimado:</span>
                            <strong>{fmtMXN(cartTotal)}</strong>
                        </div>
                        <Button
                            fullWidth
                            variant="whatsapp"
                            onClick={() => setIsLeadModalOpen(true)}
                        >
                            Finalizar Pedido
                        </Button>
                    </footer>
                )}
            </aside>

            <LeadFormModal
                isOpen={isLeadModalOpen}
                onClose={() => setIsLeadModalOpen(false)}
            />
        </>
    );
}
