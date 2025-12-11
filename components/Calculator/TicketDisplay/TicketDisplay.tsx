// components/Calculator/TicketDisplay/TicketDisplay.tsx
import { useState, useEffect } from 'react';
import { QuoteBreakdown } from '@/types/domain';
import { fmtMXN } from '@/lib/utils';
import { env } from '@/config/env';

import styles from './TicketDisplay.module.scss';

interface TicketDisplayProps {
    variant: 'preview' | 'full';
    quote: QuoteBreakdown | null; // May be null
    folio?: string;
    customerName?: string;
}

export function TicketDisplay({ variant, quote, folio, customerName }: TicketDisplayProps) {
    const isPreview = variant === 'preview';
    const [dateStr, setDateStr] = useState('');

    // Initialize date on mount
    // MOVED UP: Hooks must execute unconditionally before any return
    useEffect(() => {
        setDateStr(
            new Date().toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        );
    }, []);

    // If no quote, show empty state
    if (!quote) {
        return (
            <div className={styles.emptyState}>
                <p>No hay datos de cotización disponibles.</p>
            </div>
        );
    }

    // Avoid NaN/Infinity if subtotal is 0
    const vatPercentage = quote.subtotal > 0 ? Math.round((quote.vat / quote.subtotal) * 100) : 8;

    return (
        <div className={`${styles.ticket} ${styles[variant]}`}>
            <div className={styles.perforationTop} aria-hidden="true" />

            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.brand}>{env.NEXT_PUBLIC_BRAND_NAME}</span>

                    <span className={styles.meta}>{folio ? `Folio: ${folio}` : 'COTIZACIÓN PRELIMINAR'}</span>

                    <span className={styles.meta}>{dateStr || '...'}</span>
                </div>

                <hr className={styles.divider} />

                {/* Customer */}
                {!isPreview && customerName && (
                    <div className={styles.customerRow}>
                        <span>Cliente:</span>
                        <strong>{customerName}</strong>
                    </div>
                )}

                {/* Items */}
                <div className={styles.items}>
                    {quote.breakdownLines.map((line, idx) => (
                        <div key={idx} className={styles.lineItem} data-type={line.type}>
                            <span className={styles.itemLabel}>{line.label}</span>
                            <span className={styles.itemPrice}>{fmtMXN(line.value)}</span>
                        </div>
                    ))}
                </div>

                <hr className={styles.divider} />

                {/* Totals */}
                <div className={styles.totals}>
                    <div className={styles.totalRow}>
                        <span>Subtotal</span>
                        <span>{fmtMXN(quote.subtotal)}</span>
                    </div>

                    <div className={styles.totalRow}>
                        <span>IVA ({vatPercentage}%)</span>
                        <span>{fmtMXN(quote.vat)}</span>
                    </div>

                    <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                        <span>TOTAL</span>
                        <span>{fmtMXN(quote.total)}</span>
                    </div>
                </div>

                {/* Preview overlay */}
                {isPreview && (
                    <div className={styles.previewOverlay}>
                        <p>Desglose completo disponible al formalizar</p>
                    </div>
                )}

                {/* Footer */}
                {!isPreview && (
                    <div className={styles.footer}>
                        <p>Precios sujetos a cambio sin previo aviso.</p>
                        <p>Volumetría final sujeta a verificación en obra.</p>

                        <div className={styles.printOnly}>Generado en {env.NEXT_PUBLIC_SITE_URL}</div>
                    </div>
                )}
            </div>

            <div className={styles.perforationBottom} aria-hidden="true" />
        </div>
    );
}
