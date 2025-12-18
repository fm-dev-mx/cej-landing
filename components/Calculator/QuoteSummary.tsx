// components/Calculator/QuoteSummary.tsx
'use client';

import { useState, useRef } from 'react';
import { useCejStore } from '@/store/useCejStore';
import { useQuoteCalculator } from '@/hooks/useQuoteCalculator';
import { useCheckoutUI } from '@/hooks/useCheckOutUI';
import { TicketDisplay } from './TicketDisplay/TicketDisplay';
import { SchedulingModal } from './modals/SchedulingModal';
import { Button } from '@/components/ui/Button/Button';
import { trackContact } from '@/lib/tracking/visitor';

import { getWhatsAppUrl } from '@/lib/utils';
import { env } from '@/config/env';
import { getCalculatorSteps } from '@/lib/progress';
import { FALLBACK_PRICING_RULES } from '@/config/business';

import styles from './CalculatorForm.module.scss';

/**
 * QuoteSummary - Streamlined Flow
 *
 * States:
 * 1. PREVIEW (Default): Shows compact progress guide. CTA = "Ver Total"
 * 2. TICKET + ACTIONS: Shows full breakdown + Actions (Programar, Descargar, Compartir).
 * 3. SUBMITTED: Shows ticket with folio + Success Actions.
 */

interface QuoteSummaryProps {
    hasError?: boolean;
    onFocusError?: () => void;
    onScrollToTop?: () => void;
}

export function QuoteSummary({ onScrollToTop }: QuoteSummaryProps) {
    const draft = useCejStore((s) => s.draft);
    const resetDraft = useCejStore((s) => s.resetDraft);
    const user = useCejStore((s) => s.user);
    const addToCart = useCejStore((s) => s.addToCart);
    const moveToHistory = useCejStore((s) => s.moveToHistory);

    // State
    const breakdownViewed = useCejStore((s) => s.breakdownViewed);
    const setBreakdownViewed = useCejStore((s) => s.setBreakdownViewed);

    const submittedQuote = useCejStore((s) => s.submittedQuote);
    const setSubmittedQuote = useCejStore((s) => s.setSubmittedQuote);
    const clearSubmittedQuote = useCejStore((s) => s.clearSubmittedQuote);
    const updateCartItemCustomer = useCejStore((s) => s.updateCartItemCustomer);
    const updateCartItemFolio = useCejStore((s) => s.updateCartItemFolio);

    const { quote: currentQuote, isValid, warning } = useQuoteCalculator(draft);

    // Display Quote: Submitted one OR Current Draft
    const quote = submittedQuote ? submittedQuote.results : currentQuote;
    const { isProcessing } = useCheckoutUI();

    const [isSchedulingOpen, setSchedulingOpen] = useState(false);
    const ticketRef = useRef<HTMLDivElement>(null);

    const scrollToTicket = () => {
        setTimeout(() => {
            ticketRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start", // Align to top of ticket for better view
            });
        }, 100);
    };

    // --- Handlers ---

    // 1. "Ver Total" click
    const handleViewBreakdown = () => {
        setBreakdownViewed(true);
        scrollToTicket();
    };

    // 2. Schedule Modal Success
    const handleSchedulingSuccess = (folio: string, name: string) => {
        // Need to ensure item is in cart and updated
        const itemId = addToCart(currentQuote, false);

        if (name && user.phone) {
            updateCartItemCustomer(itemId, { name, phone: user.phone });
            updateCartItemFolio(itemId, folio);
        }

        setSubmittedQuote({
            folio,
            name,
            results: currentQuote
        });

        setSchedulingOpen(false);
    };

    const handleWhatsAppClick = () => {
        trackContact("WhatsApp");
        moveToHistory();
    };

    const handleReset = () => {
        clearSubmittedQuote();
        resetDraft();
        setBreakdownViewed(false);
    };

    const handleResetCurrentMode = () => {
        // Soft reset logic
        if (draft.mode === 'knownM3') {
            useCejStore.getState().updateDraft({
                m3: '',
                strength: null,
                type: null,
                additives: []
            });
        } else {
            useCejStore.getState().updateDraft({
                workType: null, // This triggers the layout shift if not handled in CSS
                length: '',
                width: '',
                area: '',
                m3: '',
                strength: null,
                type: null,
                additives: [],
                hasCoffered: undefined,
                cofferedSize: undefined,
                thicknessByDims: undefined,
                thicknessByArea: undefined
            });
        }
        setBreakdownViewed(false);

        // Scroll to top after React commits the DOM update (layout shift)
        onScrollToTop?.();
    };

    const handleEditCalculation = () => {
        setBreakdownViewed(false);
        // Scroll up to inputs?
    };

    // --- Render Logic ---

    const stage: 'preview' | 'actions' | 'submitted' = submittedQuote
        ? 'submitted'
        : breakdownViewed
            ? 'actions'
            : 'preview';

    const whatsappUrl = submittedQuote
        ? getWhatsAppUrl(
            env.NEXT_PUBLIC_WHATSAPP_NUMBER,
            `Hola, soy ${submittedQuote.name}. Folio confirmación: ${submittedQuote.folio}.`
        )
        : undefined;

    const isVersionMismatch = quote?.pricingSnapshot && quote.pricingSnapshot.rules_version < FALLBACK_PRICING_RULES.version;

    return (
        <div className={styles.container}>
            {/* Ticket Display */}
            {/* Ticket Display - HIDDEN in PREVIEW mode to remove "Stepper" noise */}
            {stage !== 'preview' && (
                <div
                    className={styles.ticketWrapper}
                    data-ticket-container="true"
                    ref={ticketRef}
                >
                    <TicketDisplay
                        variant={stage === 'submitted' ? 'full' : 'preview'}
                        quote={quote}
                        isValidQuote={isValid}
                        folio={submittedQuote?.folio}
                        customerName={submittedQuote?.name}
                        warning={warning}
                        steps={getCalculatorSteps(draft)}
                        onReset={handleResetCurrentMode}
                    />
                </div>
            )}

            {/* CTA Interaction Area */}
            <div className={styles.field}>

                {/* 1. Initial State: "Ver Total" */}
                {stage === 'preview' && (
                    <>
                        <Button
                            fullWidth
                            variant="primary"
                            onClick={handleViewBreakdown}
                            // Always enabled. Validation happens on click.
                            disabled={false}
                        >
                            Ver Total
                        </Button>

                        <p className={styles.summaryFooter}>
                            {isValid
                                ? 'Continúa para ver el detalle de costos.'
                                : 'Completa los pasos para ver el total.'}
                        </p>
                    </>
                )}

                {/* 2. Ticket Visible + Actions */}
                {stage === 'actions' && (
                    <div className={styles.animateFadeIn}>
                        <div className={styles.successActions}>
                            {/* Recalculate Prompt if Version Mismatch */}
                            {isVersionMismatch && (
                                <div className={styles.versionAlertPrompt}>
                                    <Button
                                        fullWidth
                                        variant="secondary"
                                        onClick={handleViewBreakdown} // Re-trigger calculation
                                    >
                                        🔄 Actualizar a precios actuales
                                    </Button>
                                </div>
                            )}

                            {/* Primary: Programar / Agendar */}
                            <Button
                                fullWidth
                                variant="primary"
                                onClick={() => setSchedulingOpen(true)}
                                isLoading={isProcessing}
                            >
                                📅 Programar Pedido
                            </Button>

                            <p className={styles.summaryFooter}>
                                Agenda tu entrega o recibe asistencia personalizada.
                            </p>

                            {/* Secondary Actions Grid */}
                            <div className={styles.gridActions}>
                                <Button
                                    fullWidth
                                    variant="secondary"
                                    onClick={() => window.print()}
                                >
                                    📄 Descargar PDF
                                </Button>
                                <Button
                                    fullWidth
                                    variant="secondary"
                                    onClick={() => {
                                        const url = window.location.href; // Simple share
                                        navigator.clipboard.writeText(url);
                                        alert("Enlace copiado");
                                    }}
                                >
                                    🔗 Compartir
                                </Button>
                            </div>

                            {/* Edit / Back */}
                            <button
                                onClick={handleEditCalculation}
                                className={styles.editQuoteDataBtn}
                                type="button"
                            >
                                ← Editar cálculo
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. Submitted / Success State */}
                {stage === 'submitted' && (
                    <div className={styles.successActions}>
                        <div className={styles.note}>
                            ✅ Tu solicitud ha sido registrada.
                        </div>

                        <Button
                            fullWidth
                            variant="whatsapp"
                            href={whatsappUrl}
                            target="_blank"
                            onClick={handleWhatsAppClick}
                        >
                            Ir al chat de Ventas
                        </Button>

                        <div className={styles.gridActions}>
                            <Button
                                fullWidth
                                variant="secondary"
                                onClick={() => window.print()}
                            >
                                📄 Guardar PDF
                            </Button>
                        </div>

                        <button
                            onClick={handleReset}
                            className={styles.newQuoteBtn}
                        >
                            Nueva Cotización
                        </button>
                    </div>
                )}
            </div>

            <SchedulingModal
                isOpen={isSchedulingOpen}
                onClose={() => setSchedulingOpen(false)}
                onSuccess={handleSchedulingSuccess}
            />
        </div >
    );
}
