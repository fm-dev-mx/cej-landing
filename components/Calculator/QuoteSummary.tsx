// components/Calculator/QuoteSummary.tsx
'use client';

import { useState, useRef } from 'react';
import { useCejStore } from '@/store/useCejStore';
import { useQuoteCalculator } from '@/hooks/useQuoteCalculator';
import { useCheckoutUI } from '@/hooks/useCheckOutUI';
import { TicketDisplay } from './TicketDisplay/TicketDisplay';
import { LeadFormModal } from './modals/LeadFormModal';
import { Button } from '@/components/ui/Button/Button';
import { trackContact } from '@/lib/tracking/visitor';

import { fmtMXN, getWhatsAppUrl } from '@/lib/utils';
import { env } from '@/config/env';

import styles from './CalculatorForm.module.scss';

/**
 * QuoteSummary - Progressive Disclosure Flow (Phase 1)
 *
 * States:
 * 1. PREVIEW: Shows compact summary, CTA = "Ver Desglose de Cotización"
 * 2. BREAKDOWN: Shows full breakdown, CTA = "Confirmar y Generar Ticket"
 * 3. SUBMITTED: Shows ticket with folio, CTA = "Enviar a WhatsApp"
 */

interface QuoteSummaryProps {
    /** Whether the calculator form has validation errors */
    hasError?: boolean;
    /** Callback to focus the first invalid input field */
    onFocusError?: () => void;
}

export function QuoteSummary({ hasError, onFocusError }: QuoteSummaryProps) {
    const draft = useCejStore((s) => s.draft);
    const resetDraft = useCejStore((s) => s.resetDraft);
    const user = useCejStore((s) => s.user);
    const cart = useCejStore((s) => s.cart);
    const addToCart = useCejStore((s) => s.addToCart);
    const moveToHistory = useCejStore((s) => s.moveToHistory);
    const setDrawerOpen = useCejStore((s) => s.setDrawerOpen);
    const setActiveTab = useCejStore((s) => s.setActiveTab);

    // Phase 1: Progressive disclosure state
    const breakdownViewed = useCejStore((s) => s.breakdownViewed);
    const setBreakdownViewed = useCejStore((s) => s.setBreakdownViewed);

    // Phase 0: Global submission state
    const submittedQuote = useCejStore((s) => s.submittedQuote);
    const setSubmittedQuote = useCejStore((s) => s.setSubmittedQuote);
    const clearSubmittedQuote = useCejStore((s) => s.clearSubmittedQuote);
    const updateCartItemCustomer = useCejStore((s) => s.updateCartItemCustomer);

    const { quote: currentQuote, isValid, warning } = useQuoteCalculator(draft);

    // If we have a submitted quote, show IT. Otherwise show the live calculator quote.
    // usage: quote to display
    const quote = submittedQuote ? submittedQuote.results : currentQuote;
    const { processOrder, isProcessing } = useCheckoutUI();

    const [isModalOpen, setModalOpen] = useState(false);

    const ticketRef = useRef<HTMLDivElement>(null);

    const scrollToTicket = () => {
        setTimeout(() => {
            ticketRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }, 100);
    };

    // --- Handlers ---

    // Stage 1 -> Stage 2: User clicks "Ver Desglose"
    const handleViewBreakdown = () => {
        setBreakdownViewed(true);
        scrollToTicket();
    };

    // Stage 2 -> Stage 3: User confirms and generates ticket
    const handleConfirmAndGenerate = async () => {
        if (user.name && user.phone) {
            const customer = { name: user.name, phone: user.phone };

            // 1. Add to cart immediately (creates draft -> cart item)
            // This resets the draft, but we have `quote` (which is currentQuote here)
            const itemId = addToCart(currentQuote);

            // 2. Process order
            const result = await processOrder(customer, false);

            if (result.success && result.folio) {
                // 3. Update cart item with customer info
                updateCartItemCustomer(itemId, customer);

                // 4. Set submitted state with RESULTS (to persist view)
                setSubmittedQuote({
                    folio: result.folio,
                    name: user.name,
                    results: currentQuote
                });

                scrollToTicket();
            }
        } else {
            setModalOpen(true);
        }
    };

    // Stage 3: Modal success callback
    const handleModalSuccess = (folio: string, name: string) => {
        // Modal handles processOrder internally.
        // But we MUST Add to Cart here because it wasn't done yet.
        // Note: currentQuote is still valid here because addToCart hasn't run yet.
        const itemId = addToCart(currentQuote);

        // Update cart item with customer info we just got
        // Note: user.phone is updated by the modal before calling onSuccess
        if (name && user.phone) {
            updateCartItemCustomer(itemId, { name, phone: user.phone });
        }

        setSubmittedQuote({
            folio,
            name,
            results: currentQuote
        });

        setModalOpen(false);
        scrollToTicket();
    };

    // Stage 3 -> WhatsApp: Move to history only on final click
    const handleWhatsAppClick = () => {
        trackContact("WhatsApp");
        moveToHistory();
    };

    // Reset: Start a new quote
    const handleReset = () => {
        clearSubmittedQuote();
        resetDraft();
    };

    // Go back from breakdown to preview
    const handleEditCalculation = () => {
        setBreakdownViewed(false);
    };

    // --- Render Logic ---

    // Empty state: No valid calculation yet
    if (quote.total <= 0 && !submittedQuote && !isProcessing && cart.length === 0) {
        return (
            <div className={styles.emptyStateHint}>
                <p className={styles.hint}>
                    Completa los datos para ver la cotización.
                </p>
            </div>
        );
    }

    // Determine current stage
    const stage: 'preview' | 'breakdown' | 'submitted' = submittedQuote
        ? 'submitted'
        : breakdownViewed
            ? 'breakdown'
            : 'preview';

    const whatsappUrl = submittedQuote
        ? getWhatsAppUrl(
            env.NEXT_PUBLIC_WHATSAPP_NUMBER,
            `Hola, soy ${submittedQuote.name}. Acabo de generar la cotización Folio: ${submittedQuote.folio}. Me gustaría proceder con el pedido.`
        )
        : undefined;

    return (
        <div className={styles.container}>
            {/* Ticket Display - Variant changes based on stage */}
            <div
                className={styles.ticketWrapper}
                data-ticket-container="true"
                ref={ticketRef}
            >
                <TicketDisplay
                    variant={stage === 'submitted' ? 'full' : stage === 'breakdown' ? 'preview' : 'compact'}
                    quote={quote}
                    folio={submittedQuote?.folio}
                    customerName={submittedQuote?.name}
                    warning={warning}
                />
            </div>

            {/* CTA Actions - Changes based on stage */}
            <div className={styles.field}>
                {stage === 'preview' && (
                    <>
                        <Button
                            fullWidth
                            variant="primary"
                            onClick={handleViewBreakdown}
                            disabled={!isValid}
                        >
                            {
                                draft.mode === 'knownM3'
                                    ? 'Revisar cotización'
                                    : 'Ver resultado'
                            }
                        </Button>

                        <p className={styles.summaryFooter}>
                            Revisa el detalle antes de continuar.
                        </p>
                    </>
                )}

                {stage === 'breakdown' && (
                    <>
                        {warning && (
                            <div className={styles.warningNote}>
                                ⚠️{" "}
                                {warning.code === "BELOW_MINIMUM"
                                    ? `Pedido mínimo: ${warning.minM3} m³ para ${warning.typeLabel}`
                                    : `Volumen redondeado a ${warning.billedM3} m³`}
                            </div>
                        )}

                        <Button
                            fullWidth
                            variant="primary"
                            onClick={handleConfirmAndGenerate}
                            disabled={!isValid || isProcessing}
                            isLoading={isProcessing}
                            loadingText="Generando ticket..."
                        >
                            Finalizar Cotización
                        </Button>

                        <button
                            onClick={handleEditCalculation}
                            className={styles.editDataBtn}
                            type="button"
                        >
                            ← Editar cálculo
                        </button>

                        <p className={styles.summaryFooter}>
                            Al confirmar se generará un folio y podrás enviarlo por WhatsApp.
                        </p>
                    </>
                )}

                {stage === 'submitted' && (
                    <div className={styles.successActions}>
                        {/* Primary Action: WhatsApp */}
                        <Button
                            fullWidth
                            variant="whatsapp"
                            href={whatsappUrl}
                            target="_blank"
                            onClick={handleWhatsAppClick}
                        >
                            Finalizar orden en WhatsApp
                        </Button>
                        <p className={styles.successHint}>
                            Se abrirá un chat con nuestro equipo de ventas.
                        </p>

                        {/* Secondary Actions: Print and Share */}
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
                                    const folio = submittedQuote!.folio;
                                    const shareableUrl = `${window.location.origin}/?ref=shared&folio=${folio}`;
                                    if (navigator.share) {
                                        navigator.share({
                                            title: `Cotización CEJ ${folio}`,
                                            text: `Revisa mi cotización de concreto con folio ${folio}`,
                                            url: shareableUrl,
                                        }).catch(console.error);
                                    } else {
                                        navigator.clipboard.writeText(shareableUrl);
                                        alert("Link copiado al portapapeles");
                                    }
                                }}
                            >
                                🔗 Compartir
                            </Button>
                        </div>

                        {/* User Data Edit */}
                        {user.name && (
                            <button
                                onClick={() => setModalOpen(true)}
                                className={styles.editDataBtn}
                            >
                                ¿No eres {user.name}? Editar mis datos
                            </button>
                        )}

                        {/* Tertiary Actions */}
                        <button
                            onClick={() => {
                                setActiveTab('history');
                                setDrawerOpen(true);
                            }}
                            className={styles.historyBtn}
                        >
                            📂 Ver historial de cotizaciones
                        </button>

                        <button
                            onClick={handleReset}
                            className={styles.newQuoteBtn}
                        >
                            Nueva Cotización
                        </button>
                    </div>
                )}
            </div>

            <LeadFormModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
}
