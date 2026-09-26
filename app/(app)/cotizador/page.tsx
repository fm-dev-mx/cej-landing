'use client';

import { useEffect, useState } from 'react';
import ToolShell from '@/components/layouts/ToolShell/ToolShell';
import { useCejStore } from '@/store/useCejStore';
import ExpertToggle from '@/components/ui/ExpertToggle/ExpertToggle';
import WizardAdapter from '@/components/Calculator/modes/WizardAdapter';
import ExpertForm from '@/components/Calculator/modes/ExpertForm';
import FeedbackToast from '@/components/ui/FeedbackToast/FeedbackToast';
import QuoteDrawer from '@/components/QuoteDrawer/QuoteDrawer';
import SmartBottomBar from '@/components/SmartBottomBar/SmartBottomBar';
import styles from './CotizadorPage.module.scss';

export default function CotizadorPage() {
    const [isHydrated, setIsHydrated] = useState(false);
    const viewMode = useCejStore(s => s.viewMode);
    const cart = useCejStore(s => s.cart);
    const history = useCejStore(s => s.history);
    const isDrawerOpen = useCejStore(s => s.isDrawerOpen);
    const setActiveTab = useCejStore(s => s.setActiveTab);
    const setDrawerOpen = useCejStore(s => s.setDrawerOpen);

    useEffect(() => {
        // Timeout prevents synchronous setState cascading render warning
        const timer = setTimeout(() => setIsHydrated(true), 0);
        return () => clearTimeout(timer);
    }, []);

    if (!isHydrated) return null;

    return (
        <ToolShell actions={<ExpertToggle />}>
            <div className={styles.pageContainer}>
                <div className={styles.modeHeader}>
                    <p className={styles.modeText}>
                        Modo: <strong>{viewMode === 'wizard' ? 'Guiado' : 'Experto'}</strong>
                    </p>
                    {(cart.length > 0 || history.length > 0) && (
                        <button
                            type="button"
                            className={styles.cartButton}
                            aria-expanded={isDrawerOpen}
                            onClick={() => {
                                setActiveTab(cart.length > 0 ? 'order' : 'history');
                                setDrawerOpen(true);
                            }}
                        >
                            {cart.length > 0 ? `Ver pedido (${cart.length})` : 'Mis obras'}
                        </button>
                    )}
                </div>

                {viewMode === 'wizard' ? (
                    <WizardAdapter />
                ) : (
                    <ExpertForm />
                )}
            </div>

            <FeedbackToast />
            <SmartBottomBar />
            <QuoteDrawer />
        </ToolShell>
    );
}
