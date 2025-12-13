// components/Calculator/TicketDisplay/TicketDisplay.tsx
import { QuoteBreakdown, QuoteWarning } from '@/types/domain';
import { fmtMXN } from '@/lib/utils';
import { env } from '@/config/env';
import styles from './TicketDisplay.module.scss';


interface TicketDisplayProps {
    variant: 'compact' | 'preview' | 'full';
    quote: QuoteBreakdown | null;
    folio?: string;
    customerName?: string;
    warning?: QuoteWarning | null;
}

/**
 * TicketDisplay - Shows quote information with different levels of detail
*
* Variants:
* - compact: Minimal view with just total and volume (Phase 1 - initial state)
* - preview: Full breakdown without folio (Phase 1 - after "Ver Desglose")
* - full: Complete ticket with folio and customer info (after submission)
*/
export function TicketDisplay({ variant, quote, folio, customerName, warning }: TicketDisplayProps) {
    // If no quote, show empty state
    if (!quote) {
        return (
            <div className={styles.emptyState}>
                <p>No hay datos de cotización disponibles.</p>
            </div>
        );
    }

    // Optimization: Calculate date directly during render.
    const dateStr = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Avoid NaN/Infinity if subtotal is 0
    const vatPercentage = quote.subtotal > 0 ? Math.round((quote.vat / quote.subtotal) * 100) : 8;

    // Compact variant: Simplified summary view
    if (variant === 'compact') {
        return (
            <div className={`${styles.ticket} ${styles.compact}`}>
                <div className={styles.compactContent}>
                    <div className={styles.compactHeader}>
                        <span className={styles.compactLabel}>Cotización Estimada</span>
                    </div>

                    <div className={styles.compactTotal}>
                        <span className={styles.compactTotalLabel}>Total</span>
                        <span className={styles.compactTotalValue}>{fmtMXN(quote.total)}</span>
                    </div>

                    {quote.volume && (
                        <div className={styles.compactMeta}>
                            <span>{quote.volume.billedM3} m³ • {quote.concreteType === 'pumped' ? 'Bomba' : 'Directo'}</span>
                        </div>
                    )}

                    <p className={styles.compactHint}>
                        Haz clic en "Ver Desglose" para revisar el detalle.
                    </p>

                    {warning && (
                        <div className={styles.warningNote}>
                            ℹ️{" "}
                            {warning.code === "BELOW_MINIMUM"
                                ? "Pedido mínimo ajustado"
                                : "Volumen redondeado"}
                        </div>
                    )}


                </div>
            </div>
        );
    }

    // Preview and Full variants: Full ticket display
    const showFolio = variant === 'full' && folio;
    const showCustomer = variant === 'full' && customerName;

    return (
        <div className={styles.ticket}>
            <div className={styles.perforationTop} aria-hidden="true" />

            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.brand}>{env.NEXT_PUBLIC_BRAND_NAME}</span>

                    <div className={styles.metaCol}>
                        <span className={styles.meta}>
                            {showFolio ? `Folio: ${folio}` : "COTIZACIÓN PRELIMINAR"}
                        </span>
                        <span className={styles.meta} suppressHydrationWarning>
                            {dateStr}
                        </span>
                        {showFolio && (
                            <span className={styles.metaValidity}>
                                Vigencia: 7 días
                            </span>
                        )}
                    </div>
                </div>

                <hr className={styles.divider} />

                {/* Customer - Only in full variant */}
                {showCustomer && (
                    <div className={styles.customerRow}>
                        <span>Cliente:</span>
                        <strong>{customerName}</strong>
                    </div>
                )}

                {/* Volume Info - Always visible in preview/full */}
                {quote.volume && (
                    <div className={styles.volumeInfo}>
                        <div className={styles.volumeRow}>
                            <span>Volumen</span>
                            <span>{quote.volume.billedM3} m³</span>
                        </div>
                        {quote.volume.requestedM3 !== quote.volume.billedM3 && (
                            <div className={styles.volumeNote}>
                                Solicitado: {quote.volume.requestedM3.toFixed(2)} m³ → Facturado: {quote.volume.billedM3.toFixed(2)} m³
                            </div>
                        )}
                    </div>
                )}

                {/* Calculation Details - If available */}
                {quote.calculationDetails && (
                    <div className={styles.calculationDetails}>
                        <span className={styles.calculationLabel}>Cálculo:</span>
                        <span className={styles.calculationFormula}>{quote.calculationDetails.formula}</span>
                    </div>
                )}

                {/* Items */}
                <div className={styles.items}>
                    {quote.breakdownLines.map((line, idx) => (
                        <div
                            key={idx}
                            className={styles.lineItem}
                            data-type={line.type}
                        >
                            <span className={styles.itemLabel}>
                                {line.label}
                            </span>
                            <span className={styles.itemPrice}>
                                {fmtMXN(line.value)}
                            </span>
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

                {/* Footer */}
                <div className={styles.footer}>
                    <p className={styles.disclaimerMain}>
                        ⚠ Cotización preliminar sujeta a visita técnica.
                    </p>
                    <p>Precios sujetos a cambio sin previo aviso.</p>
                    <p>Volumetría final sujeta a verificación en obra.</p>

                    <div className={styles.printOnly}>
                        Generado en {env.NEXT_PUBLIC_SITE_URL}
                    </div>
                </div>
            </div>

            <div className={styles.perforationBottom} aria-hidden="true" />
        </div>
    );
}
