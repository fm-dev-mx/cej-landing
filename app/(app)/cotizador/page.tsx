'use client';

import { useEffect, useState } from 'react';
import ToolShell from '@/components/layouts/ToolShell/ToolShell';
import { CalculatorForm } from '@/components/Calculator/CalculatorForm';

export default function CotizadorPage() {
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    if (!isHydrated) return null;

    return (
        <ToolShell>
            <div style={{ paddingBottom: '80px' }}>
                <div className="container" style={{ maxWidth: '640px', margin: '0 auto' }}>
                    {/* Note: QuoteDrawer, SmartBottomBar, and Toast are now mounted
                      in the RootLayout (app/layout.tsx) via GlobalUI to ensure
                      availability on the Marketing side as well.
                    */}
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
