// components/Calculator/CalculatorSummary.tsx
'use client';

import { useCejStore } from '@/store/useCejStore';
import { Button } from '@/components/ui/Button/Button';
import { fmtMXN } from '@/lib/utils';
import { type QuoteBreakdown } from '@/components/Calculator/types';
import styles from './CalculatorSteps.module.scss'; // Reusing styling

interface Props {
    quote: QuoteBreakdown;
    isValid: boolean;
}

export function CalculatorSummary({ quote, isValid }: Props) {
    const addToCart = useCejStore((s) => s.addToCart);

    const handleAdd = () => {
        if (!isValid) return;
        addToCart(quote);
    };

    if (quote.total <= 0) {
        return (
            <div style={{ marginTop: '2rem', textAlign: 'center', opacity: 0.5 }}>
                <p className={styles.hint}>Completa los datos para ver el precio.</p>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            padding: '1.5rem',
            borderRadius: '1rem',
            marginTop: '1.5rem',
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '1rem' }}>
                <div>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1' }}>VOLUMEN</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                        {quote.volume.billedM3.toFixed(2)} m³
                    </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1' }}>TOTAL ESTIMADO</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fec914' }}>
                        {fmtMXN(quote.total)}
                    </span>
                </div>
            </div>

            <Button
                fullWidth
                variant="primary"
                onClick={handleAdd}
                disabled={!isValid}
            >
                Agregar al Pedido <span>+</span>
            </Button>

            {quote.calculationDetails && (
                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem', textAlign: 'center' }}>
                    Cálculo: {quote.calculationDetails.formula}
                </p>
            )}
        </div>
    );
}
