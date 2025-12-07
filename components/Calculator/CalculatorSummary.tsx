// components/Calculator/CalculatorSummary.tsx
'use client';

import { useState } from 'react';
import { useCejStore } from '@/store/useCejStore';
import { Button } from '@/components/ui/Button/Button';
import { fmtMXN } from '@/lib/utils';
import { type QuoteBreakdown } from '@/components/Calculator/types';
import styles from './CalculatorForm.module.scss';

interface Props {
    quote: QuoteBreakdown;
    isValid: boolean;
}

export function CalculatorSummary({ quote, isValid }: Props) {
    const addToCart = useCejStore((s) => s.addToCart);
    const [isAdded, setIsAdded] = useState(false);

    const handleAdd = () => {
        if (!isValid) return;
        addToCart(quote);

        // Trigger micro-interaction
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 1500);
    };

    if (quote.total <= 0) {
        return (
            <div style={{ marginTop: '2rem', textAlign: 'center', opacity: 0.5 }}>
                <p className={styles.hint}>Completa los datos para ver el precio.</p>
            </div>
        );
    }

    const summaryClass = `${styles.summary} ${isAdded ? styles.summarySuccess : ''}`;

    return (
        <div className={summaryClass}>
            <div className={styles.summaryRow}>
                <div>
                    <span className={styles.summaryLabel}>
                        Volumen Facturable
                    </span>
                    <span className={styles.summaryValue}>
                        {quote.volume.billedM3.toFixed(2)} m³
                    </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span className={styles.summaryLabel}>
                        Total Estimado
                    </span>
                    <span className={styles.summaryValueHighlight}>
                        {fmtMXN(quote.total)}
                    </span>
                </div>
            </div>

            <Button
                fullWidth
                variant={isAdded ? 'secondary' : 'primary'}
                onClick={handleAdd}
                disabled={!isValid || isAdded}
                style={{
                    backgroundColor: isAdded ? 'var(--c-success)' : undefined,
                    borderColor: isAdded ? 'var(--c-success)' : undefined,
                    color: isAdded ? 'white' : undefined,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                {isAdded ? (
                    <>
                        <span aria-hidden="true">✓</span> Agregado
                    </>
                ) : (
                    <>
                        Agregar al Pedido <span aria-hidden="true">+</span>
                    </>
                )}
            </Button>

            {quote.calculationDetails && (
                <p className={styles.summaryFooter}>
                    Base de cálculo: {quote.calculationDetails.formula}
                </p>
            )}
        </div>
    );
}
