// components/QuoteDrawer/QuoteDrawer.tsx
'use client';

import { useState } from 'react';
import { useCejStore, type QuoteItem } from '@/store/useCejStore';
import { fmtMXN } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import CheckoutModal from '@/components/Checkout/CheckoutModal';
import styles from './QuoteDrawer.module.scss';

export default function QuoteDrawer() {
    const {
        isDrawerOpen, setDrawerOpen,
        activeTab, setActiveTab,
        cart, history, removeFromCart,
        loadHistoryItemAsDraft // New action
    } = useCejStore();

    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    if (!isDrawerOpen) return null;

    const listData = activeTab === 'order' ? cart : history;
    const cartTotal = cart.reduce((sum, item) => sum + item.results.total, 0);

    const handleCheckoutClick = () => {
        setIsCheckoutOpen(true);
    };

    const handleClone = (item: QuoteItem) => {
        if (confirm('¿Quieres cargar esta cotización en el calculador? Se perderán los datos actuales no guardados.')) {
            loadHistoryItemAsDraft(item);
        }
    };

    // Helper to format date relative
    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString('es-MX', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={styles.backdrop}
                onClick={() => setDrawerOpen(false)}
                aria-hidden="true"
            />

            {/* Panel */}
            <aside className={styles.drawer}>
                <header className={styles.header}>
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === 'order' ? styles.active : ''}`}
                            onClick={() => setActiveTab('order')}
                        >
                            Pedido Actual ({cart.length})
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            Mis Obras 📂
                        </button>
                    </div>
                    <button className={styles.closeBtn} onClick={() => setDrawerOpen(false)}>×</button>
                </header>

                <div className={styles.body}>
                    {listData.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>
                                {activeTab === 'order'
                                    ? 'Aún no has agregado nada al pedido.'
                                    : 'Aquí aparecerán tus cotizaciones pasadas.'}
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
                                            {item.config.label || (item.config.mode === 'wizard' ? 'Cálculo Guiado' : 'Cálculo Experto')}
                                        </span>
                                        <span className={styles.itemDate}>
                                            {formatDate(item.timestamp)}
                                        </span>
                                    </div>

                                    <div className={styles.itemDetails}>
                                        <div className={styles.detailBadge}>
                                            {item.results.volume.billedM3.toFixed(1)} m³
                                        </div>
                                        <div className={styles.detailBadge}>
                                            {item.results.concreteType === 'pumped' ? 'Bomba' : 'Directo'}
                                        </div>
                                    </div>

                                    <div className={styles.itemFooter}>
                                        <span className={styles.itemPrice}>{fmtMXN(item.results.total)}</span>

                                        <div className={styles.itemActions}>
                                            {activeTab === 'order' ? (
                                                <button
                                                    className={styles.textBtnDanger}
                                                    onClick={() => removeFromCart(item.id)}
                                                >
                                                    Eliminar
                                                </button>
                                            ) : (
                                                <button
                                                    className={styles.textBtnPrimary}
                                                    onClick={() => handleClone(item)}
                                                >
                                                    ↺ Cotizar de nuevo
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
                            onClick={handleCheckoutClick}
                        >
                            Finalizar Pedido por WhatsApp
                        </Button>
                    </footer>
                )}
            </aside>

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
            />
        </>
    );
}
