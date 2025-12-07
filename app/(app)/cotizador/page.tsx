// app/(app)/cotizador/page.tsx
'use client';

import { useEffect, useState } from 'react';
import ToolShell from '@/components/layouts/ToolShell/ToolShell';
import { CalculatorForm } from '@/components/Calculator/CalculatorForm';
import FeedbackToast from '@/components/ui/FeedbackToast/FeedbackToast';
import QuoteDrawer from '@/components/QuoteDrawer/QuoteDrawer';
import SmartBottomBar from '@/components/SmartBottomBar/SmartBottomBar';
import { useCejStore } from '@/store/useCejStore';

export default function CotizadorPage() {
    const [isHydrated, setIsHydrated] = useState(false);
    const cart = useCejStore(s => s.cart);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    if (!isHydrated) return null;

    return (
        <ToolShell>
            <div style={{ paddingBottom: '80px' }}>
                <div className="container" style={{ maxWidth: '640px', margin: '0 auto' }}>
                    {/* Reuse the Logic Component directly in the App shell */}
                    <div style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <CalculatorForm />
                    </div>
                </div>
            </div>

            <FeedbackToast />
            <SmartBottomBar />
            <QuoteDrawer />
        </ToolShell>
    );
}
