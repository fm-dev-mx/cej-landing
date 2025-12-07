'use client';

import { useState } from 'react';
import { useCejStore } from '@/store/useCejStore';
import { fmtMXN } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import { LeadFormModal } from '@/components/Calculator/modals/LeadFormModal';
import styles from './QuoteDrawer.module.scss';

export default function QuoteDrawer() {
    const {
        isDrawerOpen, setDrawerOpen,
        activeTab, setActiveTab,
        cart, history, removeFromCart,
        loadItemAsDraft
    } = useCejStore();

    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

    if (!isDrawerOpen) return null;

    const listData = activeTab === 'order' ? cart : history;
    const cartTotal = cart.reduce((sum, item) => sum + item.results.total, 0);

    const handleClone = (item: any) => {
        if (confirm('¿Cargar esta cotización? Se perderán los datos actuales no guardados.')) {
            loadItemAsDraft(item);
        }
    };

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString('es-MX', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

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
                                            {item.config.label || 'Cotización'}
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
                                                    ↺ Usar medidas
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
                mode="checkout"
            />
        </>
    );
}
