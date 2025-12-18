import { QuoteBreakdown, QuoteWarning, QuoteLineItem } from '@/types/domain';
import { QuoteSnapshot } from '@/types/database';
import { fmtMXN } from '@/lib/utils';
import { env } from '@/config/env';
import { FALLBACK_PRICING_RULES } from '@/config/business';
import styles from './TicketDisplay.module.scss';

// Type union to support both runtime breakdown and stored snapshot
type TicketQuote = QuoteBreakdown | QuoteSnapshot;

interface TicketDisplayProps {
    variant: 'compact' | 'preview' | 'full';
    quote: TicketQuote | null;
    /** Indicates if the quote has valid data (volume > 0, required inputs satisfied) */
    isValidQuote?: boolean;
    folio?: string;
    customerName?: string;
    warning?: QuoteWarning | null;
    steps?: { id: string; label: string; isCompleted: boolean; isActive: boolean }[];
    onReset?: () => void;
    className?: string;
}

/**
 * TicketDisplay - Shows quote information with different levels of detail
*
* Variants:
* - compact: Minimal view with just total and volume (Phase 1 - initial state)
* - preview: Full breakdown without folio (Phase 1 - after "Ver Desglose")
* - full: Complete ticket with folio and customer info (after submission)
*/
export function TicketDisplay({ variant, quote, isValidQuote = true, folio, customerName, steps, onReset, className }: TicketDisplayProps) {
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

    // Helper to determine subtotal/vat/total regardless of quote shape
    // QuoteBreakdown has: subtotal, vat, total at root level
    // QuoteSnapshot has: financials.subtotal, financials.vat, financials.total
    let total: number;
    let subtotal: number;
    let vat: number;

    if ('subtotal' in quote && 'vat' in quote && 'total' in quote) {
        // QuoteBreakdown structure (runtime calculation)
        subtotal = quote.subtotal;
        vat = quote.vat;
        total = quote.total;
    } else if ('financials' in quote) {
        // QuoteSnapshot structure (from database)
        total = quote.financials.total;

        // Prefer stored subtotal/vat if available (enhanced schema)
        if ('subtotal' in quote.financials && 'vat' in quote.financials) {
            subtotal = quote.financials.subtotal;
            vat = quote.financials.vat;
        } else {
            // Legacy fallback: back-calculate from items or assume 8% VAT
            const itemsTotal = (quote.items || []).reduce((acc, item) => acc + (item.subtotal || 0), 0);
            if (itemsTotal > 0) {
                subtotal = itemsTotal;
                vat = total - subtotal;
            } else {
                subtotal = total / 1.08;
                vat = total - subtotal;
            }
        }
    } else {
        // Fallback
        total = 0;
        subtotal = 0;
        vat = 0;
    }

    // Avoid NaN/Infinity if subtotal is 0
    const vatPercentage = subtotal > 0 ? Math.round((vat / subtotal) * 100) : 8;

    // Resolve lines to display - prefer breakdownLines if available
    const lines: QuoteLineItem[] = ('breakdownLines' in quote && quote.breakdownLines && quote.breakdownLines.length > 0)
        ? quote.breakdownLines
        : ('items' in quote && quote.items)
            ? quote.items.map(item => ({
                label: item.label,
                value: item.subtotal,
                type: 'base' as const
            }))
            : [];

    // Compact variant: Simplified summary view (Horizontal Bar)
    if (variant === 'compact') {
        const currentLabel = steps?.find(s => s.isActive)?.label || "Completar";

        return (
            <div className={`${styles.ticket} ${styles.compact}`}>
                <div className={styles.compactContent}>
                    {/* Left: Status / Prompt */}
                    <div className={styles.compactInfo}>
                        <span className={styles.compactTitle}>
                            {isValidQuote ? "Todo listo" : currentLabel}
                        </span>
                        <div className={styles.miniProgress}>
                            {steps?.map((step) => (
                                <div
                                    key={step.id}
                                    className={`${styles.miniDot} ${step.isCompleted ? styles.completed : ''} ${step.isActive ? styles.active : ''}`}
                                    aria-hidden="true"
                                />
                            ))}
                        </div>
                    </div>

                    <div className={styles.resetContainer}>
                        {/* Reset Action */}
                        {onReset && (
                            <button onClick={onReset} className={styles.resetBtn} type="button">
                                Reiniciar cálculo
                            </button>
                        )}
                    </div>

                    {/* Right: Action Hint */}
                    <div className={styles.compactAction}>
                        {isValidQuote && (
                            <span className={styles.compactHintText}>Continuar ↓</span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Preview and Full variants: Full ticket display
    const showFolio = variant === 'full' && folio;
    const showCustomer = variant === 'full' && customerName;

    return (
        <div className={`${styles.ticket} ${className || ''}`}>
            <div className={styles.perforationTop} aria-hidden="true" />

            {/* Price Mismatch Alert */}
            {'pricingSnapshot' in quote && quote.pricingSnapshot && quote.pricingSnapshot.rules_version < FALLBACK_PRICING_RULES.version && (
                <div className={styles.versionAlert} role="alert">
                    <span className={styles.alertIcon}>⚠</span>
                    <div className={styles.alertContent}>
                        <strong>Precios actualizados</strong>
                        <p>Los costos base han cambiado desde que se creó esta cotización.</p>
                    </div>
                </div>
            )}

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
                {'volume' in quote && quote.volume && (
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
                {'calculationDetails' in quote && quote.calculationDetails && (
                    <div className={styles.calculationDetails}>
                        <span className={styles.calculationLabel}>Cálculo:</span>
                        <span className={styles.calculationFormula}>{quote.calculationDetails.formula}</span>
                    </div>
                )}

                {/* Items */}
                <div className={styles.items}>
                    {lines.map((line, idx) => (
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
                        <span>{fmtMXN(subtotal)}</span>
                    </div>

                    <div className={styles.totalRow}>
                        <span>IVA ({vatPercentage}%)</span>
                        <span>{fmtMXN(vat)}</span>
                    </div>

                    <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                        <span>TOTAL</span>
                        <span>{fmtMXN(total)}</span>
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
