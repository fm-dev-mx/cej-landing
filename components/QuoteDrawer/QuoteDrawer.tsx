'use client';

import { useState } from 'react';
import { useCejStore } from '@/store/useCejStore';
import { fmtMXN } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import CheckoutModal from '@/components/Checkout/CheckoutModal';
import styles from './QuoteDrawer.module.scss';

export default function QuoteDrawer() {
    const {
        isDrawerOpen, setDrawerOpen,
        activeTab, setActiveTab,
        cart, history, removeFromCart
    } = useCejStore();

    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    if (!isDrawerOpen) return null;

    const listData = activeTab === 'order' ? cart : history;
    const cartTotal = cart.reduce((sum, item) => sum + item.results.total, 0);

    const handleCheckoutClick = () => {
        setIsCheckoutOpen(true);
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
                    {listData.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No hay ítems aquí.</p>
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
                                            {/* Logic to create a title like "Losa - f'c 200" */}
                                            {/* Assuming workType is available in item.inputs.workType or similar */}
                                            {item.config.mode === 'wizard' ? 'Cálculo Guiado' : 'Cálculo Experto'}
                                        </span>
                                        <span className={styles.itemDate}>
                                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className={styles.itemDetails}>
                                        <span>Vol: <strong>{item.results.volume.billedM3} m³</strong></span>
                                        <span>Res: <strong>{item.results.strength}</strong></span>
                                    </div>
                                    <div className={styles.itemFooter}>
                                        <span className={styles.itemPrice}>{fmtMXN(item.results.total)}</span>
                                        {activeTab === 'order' && (
                                            <button
                                                className={styles.removeBtn}
                                                onClick={() => removeFromCart(item.id)}
                                            >
                                                Eliminar
                                            </button>
                                        )}
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
