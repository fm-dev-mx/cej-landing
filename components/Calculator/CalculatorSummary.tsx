'use client';

import { useState } from 'react';
import { useCejStore } from '@/store/useCejStore';
import { Button } from '@/components/ui/Button/Button';
import { fmtMXN } from '@/lib/utils';
import { type QuoteBreakdown } from '@/types/domain';
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
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 1500);
    };

    if (quote.total <= 0) {
        return (
            <div className={styles.emptyStateHint}>
                <p className={styles.hint}>Completa los datos para ver el precio.</p>
            </div>
        );
    }

    const summaryClass = `${styles.summary} ${isAdded ? styles.summarySuccess : ''}`;

    return (
        <div className={summaryClass}>
            {/* 1. Desglose Detallado */}
            <div className={styles.breakdownList}>
                {quote.breakdownLines && quote.breakdownLines.map((line, idx) => (
                    <div key={idx} className={styles.breakdownRow} data-type={line.type}>
                        <span>{line.label}</span>
                        <span>{fmtMXN(line.value)}</span>
                    </div>
                ))}

                {/* Línea de IVA */}
                <div className={`${styles.breakdownRow} ${styles.breakdownRowVat}`}>
                    <span>IVA (8%)</span>
                    <span>{fmtMXN(quote.vat)}</span>
                </div>
            </div>

            {/* 2. Total Final */}
            <div className={`${styles.summaryRow} ${styles.summaryTotalRow}`}>
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
                        Total Neto
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
