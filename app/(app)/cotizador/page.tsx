// app/(app)/cotizador/page.tsx
'use client';

import { useEffect, useState } from 'react';
import ToolShell from '@/components/layout/ToolShell/ToolShell';
import { useCejStore } from '@/store/useCejStore';
import { Button } from '@/components/ui/Button/Button';

export default function CotizadorPage() {
    // Hydration fix for persisted Zustand store
    const [isHydrated, setIsHydrated] = useState(false);

    const viewMode = useCejStore(s => s.viewMode);
    const cart = useCejStore(s => s.cart);
    const toggleViewMode = useCejStore(s => s.toggleViewMode);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    if (!isHydrated) return null; // Or a loading spinner

    return (
        <ToolShell
            actions={
                <Button
                    variant="secondary"
                    onClick={toggleViewMode}
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem', height: 'auto' }}
                >
                    {viewMode === 'wizard' ? 'Modo Experto' : 'Modo Guiado'}
                </Button>
            }
        >
            <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--c-muted-strong)' }}>
                <h2>Bienvenido a CEJ Pro</h2>
                <p>Modo Actual: <strong>{viewMode === 'wizard' ? 'Paso a Paso' : 'Experto (Grid)'}</strong></p>

                <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    border: '1px dashed var(--c-border)',
                    borderRadius: 'var(--radius)'
                }}>
                    <p>Ítems en pedido: {cart.length}</p>
                    {cart.length === 0 && <small>El carrito está vacío.</small>}
                </div>

                <p style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.7 }}>
                    Fase 1 completada. <br />
                    La lógica de cálculo está conectada en background. <br />
                    Esperando componentes UI en Fase 2.
                </p>
            </div>
        </ToolShell>
    );
}
