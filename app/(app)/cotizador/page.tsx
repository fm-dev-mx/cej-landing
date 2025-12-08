'use client';

import { useEffect, useState } from 'react';
import ToolShell from '@/components/layouts/ToolShell/ToolShell';
import { CalculatorForm } from '@/components/Calculator/CalculatorForm';
import ExpertToggle from '@/components/ui/ExpertToggle/ExpertToggle'; // Importamos el toggle

export default function CotizadorPage() {
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    if (!isHydrated) return null;

    return (
        // Inyectamos el toggle en el slot 'actions' del Shell
        <ToolShell actions={<ExpertToggle />}>
            <div style={{ paddingBottom: '80px' }}>
                <div className="container" style={{ maxWidth: '640px', margin: '0 auto' }}>
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
