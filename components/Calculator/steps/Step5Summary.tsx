// components/Calculator/steps/Step5Summary.tsx
'use client';

import { useCallback, useState, useMemo, useEffect, type MouseEvent } from 'react';
import { useCalculatorContext } from '../context/CalculatorContext';
import { fmtMXN, getWhatsAppUrl, getPhoneUrl, generateQuoteId } from '@/lib/utils';
import { trackLead, trackContact } from '@/lib/pixel';
import { env } from '@/config/env';
import {
    QUOTE_VALIDITY_DAYS,
    SUPPORT_PHONE_LABEL,
    WEBSITE_URL_LABEL,
    WORK_TYPES,
    CONCRETE_TYPES
} from '@/config/business';
import { Button } from '@/components/ui/Button/Button';
import { LeadFormModal, type LeadQuoteDetails } from '../modals/LeadFormModal';
import styles from '../Calculator.module.scss';

type Props = {
    estimateLegend: string;
};

export function Step5Summary({ estimateLegend }: Props) {
    const {
        billedM3,
        requestedM3, // Access raw calculated volume
        quote,
        unitPriceLabel,
        volumeError,
        setStep,
        resetCalculator,
        strength,
        type,
        workType,
        volumeMode,
        length,
        width,
        thicknessByDims,
        area,
        thicknessByArea,
    } = useCalculatorContext();

    const [showLeadModal, setShowLeadModal] = useState(false);
    const [folio, setFolio] = useState<string>('');
    const [showMath, setShowMath] = useState(false);

    // Generate Folio once on mount to simulate a persistent transaction ID
    useEffect(() => {
        setFolio(generateQuoteId());
    }, []);

    const today = new Date().toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    const waNumber = env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    const phone = env.NEXT_PUBLIC_PHONE;
    const phoneHref = getPhoneUrl(phone);

    // UX: More descriptive product labels
    const serviceTypeLabel = CONCRETE_TYPES.find(t => t.value === type)?.label ?? type;
    const productLabel = `Concreto f’c ${strength} kg/cm²`;
    const workTypeLabel = WORK_TYPES.find((w) => w.id === workType)?.label ?? 'Otro';

    const hasValidConfig = !!getWhatsAppUrl(waNumber, 'test');

    // UX: Detect if we are billing minimum or rounding up significantly
    const isBillingAdjusted = billedM3 !== requestedM3;

    const enrichedQuoteData = useMemo<LeadQuoteDetails>(() => {
        const specs =
            volumeMode === 'dimensions'
                ? { length, width, thickness: thicknessByDims }
                : { area, thickness: thicknessByArea };

        return {
            summary: {
                total: quote.total,
                volume: billedM3,
                product: `${productLabel} - ${serviceTypeLabel}`,
            },
            context: {
                folio,
                work_type: workTypeLabel,
                calculation_method: volumeMode,
                raw_volume: requestedM3,
                ...specs,
                formula: quote.calculationDetails?.formula
            },
        };
    }, [
        quote.total,
        quote.calculationDetails,
        billedM3,
        requestedM3,
        productLabel,
        serviceTypeLabel,
        workTypeLabel,
        volumeMode,
        length,
        width,
        thicknessByDims,
        area,
        thicknessByArea,
        folio
    ]);

    const handleWhatsAppClick = useCallback(
        (e?: MouseEvent<HTMLElement>) => {
            if (quote.total <= 0) {
                e?.preventDefault();
                return;
            }
            trackContact('whatsapp');
            setShowLeadModal(true);
        },
        [quote.total],
    );

    const handleLeadSuccess = useCallback(
        (userName: string, fbEventId: string) => {
            setShowLeadModal(false);

            trackLead({
                value: quote.total,
                currency: 'MXN',
                content_name: productLabel,
                content_category: 'Calculator Quote',
                event_id: fbEventId,
            });

            const message =
                `Hola soy ${userName}, me interesa esta pre-cotización (Folio: ${folio}):\n\n` +
                `• *Producto:* ${productLabel}\n` +
                `• *Servicio:* ${serviceTypeLabel}\n` +
                `• *Volumen:* ${billedM3.toFixed(2)} m³\n` +
                `• *Total Estimado:* ${fmtMXN(quote.total)}\n\n` +
                `¿Me pueden ayudar a confirmar el pedido?`;

            const finalWaUrl = getWhatsAppUrl(waNumber, message);

            if (finalWaUrl) {
                window.open(finalWaUrl, '_blank', 'noopener,noreferrer');
            }
        },
        [quote.total, billedM3, waNumber, productLabel, serviceTypeLabel, folio],
    );

    const handlePhoneClick = useCallback(() => {
        if (phone.trim() && quote.total > 0) {
            trackContact('phone');
        }
    }, [phone, quote.total]);

    return (
        <div className={`${styles.step} ${styles.stepAnimated}`}>
            <header className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>Cotización Lista</h2>
                <p className={styles.stepSubtitle}>
                    Este es un estimado preliminar. Confirma tu pedido con un asesor.
                </p>
            </header>

            <div className={styles.stepBody}>
                {/* TICKET CONTAINER */}
                <article
                    className={styles.ticketCard}
                    aria-label="Desglose de cotización"
                >
                    {/* Branding Watermark */}
                    <div className={styles.ticketWatermark} aria-hidden="true" />

                    <div className={styles.ticketContent}>
                        {/* Header: Brand & Meta */}
                        <div className={styles.ticketHeader}>
                            <div className={styles.ticketBrand}>
                                <span className={styles.ticketLabel}>Pre-Cotización</span>
                                <span className={styles.ticketFolio}>#{folio || '...'}</span>
                            </div>
                            <div className={styles.ticketMeta}>
                                <time className={styles.ticketDate}>{today}</time>
                                <span className={styles.ticketValidity}>
                                    Vigencia: {QUOTE_VALIDITY_DAYS} días
                                </span>
                            </div>
                        </div>

                        {/* Product Specs */}
                        <div className={styles.ticketSection}>
                            <h3 className={styles.ticketSectionTitle}>Detalles del Producto</h3>
                            <div className={styles.specGrid}>
                                <div className={styles.specItem}>
                                    <span className={styles.specLabel}>Producto</span>
                                    <span className={styles.specValue}>{productLabel}</span>
                                </div>
                                <div className={styles.specItem}>
                                    <span className={styles.specLabel}>Tipo de Servicio</span>
                                    <span className={styles.specValue}>{serviceTypeLabel}</span>
                                </div>
                                <div className={styles.specItem}>
                                    <span className={styles.specLabel}>Aplicación</span>
                                    <span className={styles.specValue}>{workTypeLabel}</span>
                                </div>

                                {/* Volume Logic Display */}
                                <div className={styles.specItem}>
                                    <span className={styles.specLabel}>Volumen a Facturar</span>
                                    <span className={styles.specValue}>{billedM3.toFixed(2)} m³</span>
                                    {isBillingAdjusted && (
                                        <span className={styles.volumeWarning}>
                                            (Cálculo estimado: {requestedM3.toFixed(2)} m³)
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Transparency Accordion */}
                            {quote.calculationDetails && (
                                <div className={styles.accordion}>
                                    <button
                                        type="button"
                                        className={styles.accordionTrigger}
                                        onClick={() => setShowMath(!showMath)}
                                    >
                                        {showMath ? '▼ Ocultar cálculo' : '▶ Ver detalles de cálculo'}
                                    </button>

                                    {showMath && (
                                        <div className={styles.accordionContent}>
                                            <div className={styles.transparencyContent}>
                                                <span className={styles.transparencyLabel}>Fórmula empleada:</span>
                                                <div className={styles.transparencyBody}>
                                                    {quote.calculationDetails.formula}
                                                    {quote.calculationDetails.effectiveThickness && (
                                                        <span className={styles.transparencySub}>
                                                            (Grosor calculado: {quote.calculationDetails.effectiveThickness} cm)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Financials */}
                        <div className={styles.ticketRows}>
                            <div className={styles.row}>
                                <span className={styles.rowLabel}>Precio Unitario</span>
                                <span className={styles.rowValue}>{unitPriceLabel}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.rowLabel}>Subtotal</span>
                                <span className={styles.rowValue}>
                                    {fmtMXN(quote.subtotal)}
                                </span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.rowLabel}>IVA (8%)</span>
                                <span className={styles.rowValue}>{fmtMXN(quote.vat)}</span>
                            </div>
                        </div>

                        <div className={styles.ticketTotal}>
                            <span className={styles.totalLabel}>Total Estimado</span>
                            <span className={styles.totalValue}>{fmtMXN(quote.total)}</span>
                        </div>

                        {/* Fixed Footer for Screenshots */}
                        <div className={styles.ticketFooter}>
                            <span className={styles.footerInfoPhone}>
                                {SUPPORT_PHONE_LABEL}
                            </span>
                            <span className={styles.footerInfoWebsite}>
                                🌐 {WEBSITE_URL_LABEL}
                            </span>
                        </div>
                    </div>
                </article>

                {/* Error Fallback */}
                {billedM3 === 0 && !volumeError && (
                    <div className={styles.error} role="alert">
                        Faltan datos para completar el cálculo.
                    </div>
                )}

                {/* Disclaimer / Warnings */}
                <p className={styles.disclaimer}>
                    <strong>Nota importante:</strong> {estimateLegend}
                    {type === 'pumped' && ' Incluye servicio de bomba pluma en el precio unitario.'}
                </p>

                {/* Actions */}
                <div className={styles.actionsGroup}>
                    <div className={styles.primaryActions}>
                        <Button
                            type="button"
                            variant="whatsapp"
                            onClick={handleWhatsAppClick}
                            disabled={!hasValidConfig || quote.total <= 0}
                            fullWidth
                            className={styles.actionButton}
                        >
                            Agendar por WhatsApp
                        </Button>

                        {phoneHref && (
                            <Button
                                variant="secondary"
                                href={phoneHref}
                                onClick={handlePhoneClick}
                                fullWidth
                                className={styles.actionButton}
                            >
                                Llamar ahora
                            </Button>
                        )}
                    </div>

                    <div className={styles.secondaryLinks}>
                        <button
                            type="button"
                            className={styles.textLink}
                            onClick={() => setStep(4)}
                            aria-label="Volver a editar especificaciones"
                        >
                            <span className={styles.linkIcon}>←</span> Regresar
                        </button>

                        <span className={styles.linkSeparator} aria-hidden="true">
                            •
                        </span>

                        <button
                            type="button"
                            className={styles.textLink}
                            onClick={resetCalculator}
                            aria-label="Iniciar una nueva cotización desde cero"
                        >
                            <span>↺</span> Nueva cotización
                        </button>
                    </div>
                </div>
            </div>

            <LeadFormModal
                isOpen={showLeadModal}
                onClose={() => setShowLeadModal(false)}
                onSuccess={handleLeadSuccess}
                quoteDetails={enrichedQuoteData}
            />
        </div>
    );
}
