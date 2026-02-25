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
                    {/* Debug visual ya no es necesario con SmartBar, pero lo mantenemos sutil */}
                    {cart.length > 0 && (
                        <span className={styles.cartBadge}>
                            {cart.length} en pedido
                        </span>
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
