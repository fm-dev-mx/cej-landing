'use client';

import { useEffect, useState } from 'react';
import ToolShell from '@/components/layouts/ToolShell/ToolShell';
import { useCejStore } from '@/store/useCejStore';
import ExpertToggle from '@/components/ui/ExpertToggle/ExpertToggle';
import WizardAdapter from '@/components/Calculator/modes/WizardAdapter';
import ExpertForm from '@/components/Calculator/modes/ExpertForm';
import FeedbackToast from '@/components/ui/FeedbackToast/FeedbackToast';

export default function CotizadorPage() {
    const [isHydrated, setIsHydrated] = useState(false);
    const viewMode = useCejStore(s => s.viewMode);
    const cart = useCejStore(s => s.cart);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    if (!isHydrated) return null;

    return (
        <ToolShell actions={<ExpertToggle />}>
            <div style={{ paddingBottom: '80px' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--c-muted-strong)' }}>
                    <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        Modo: <strong>{viewMode === 'wizard' ? 'Guiado' : 'Experto'}</strong>
                    </p>
                    {/* Debug visual del carrito */}
                    {cart.length > 0 && (
                        <span
                            style={{
                                fontSize: '0.75rem',
                                background: 'var(--c-accent)',
                                color: 'var(--c-primary-dark)',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                            }}
                        >
                            {cart.length} en pedido
                        </span>
                    )}
                </div>

                {viewMode === 'wizard' ? <WizardAdapter /> : <ExpertForm />}
            </div>

            <FeedbackToast />
        </ToolShell>
    );
}
