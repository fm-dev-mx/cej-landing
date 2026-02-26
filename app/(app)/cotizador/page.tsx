// app/(app)/cotizador/page.tsx
'use client';

import { useEffect, useState } from 'react';
import ToolShell from '@/components/layouts/ToolShell/ToolShell';
import { CalculatorForm } from '@/components/Calculator/CalculatorForm';
import ExpertToggle from '@/components/ui/ExpertToggle/ExpertToggle';

export default function CotizadorPage() {
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsHydrated(true);
    }, []);

    if (!isHydrated) return null;

    return (
        // Inject toggle into the 'actions' slot of the Shell
        <ToolShell actions={<ExpertToggle />}>
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <div style={{ paddingBottom: '80px' }}>
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <div className="container" style={{ maxWidth: '640px', margin: '0 auto' }}>
                    {/* eslint-disable-next-line react/forbid-dom-props */}
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
        </ToolShell>
    );
}
