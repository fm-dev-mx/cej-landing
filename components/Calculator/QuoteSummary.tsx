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

export function QuoteSummary() {
    const draft = useCejStore((s) => s.draft);
    const resetDraft = useCejStore((s) => s.resetDraft);
    const user = useCejStore((s) => s.user);
    const cart = useCejStore((s) => s.cart);
    const addToCart = useCejStore((s) => s.addToCart);
    const moveToHistory = useCejStore((s) => s.moveToHistory);
    const setDrawerOpen = useCejStore((s) => s.setDrawerOpen);
    const setActiveTab = useCejStore((s) => s.setActiveTab);

    // Phase 0 Bugfix: Use global submittedQuote from store instead of local state
    // This prevents data loss when component re-renders or unmounts
    const submittedQuote = useCejStore((s) => s.submittedQuote);
    const setSubmittedQuote = useCejStore((s) => s.setSubmittedQuote);
    const clearSubmittedQuote = useCejStore((s) => s.clearSubmittedQuote);

    const { quote, isValid, warning } = useQuoteCalculator(draft);
    const { processOrder, isProcessing } = useCheckoutUI();

    const [isModalOpen, setModalOpen] = useState(false);

    // Use ref instead of document.querySelector for React best practices
    const ticketRef = useRef<HTMLDivElement>(null);

    const scrollToTicket = () => {
        setTimeout(() => {
            ticketRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }, 100);
    };

    const handleSuccess = (folio: string, name: string) => {
        setSubmittedQuote({ folio, name });
        setModalOpen(false);
        scrollToTicket();
    };

    const onContinue = async () => {
        // If user contact is already available, skip modal and process directly
        if (user.name && user.phone) {
            const customer = { name: user.name, phone: user.phone };

            // 1. Move Draft -> Cart (Note: This clears draft!)
            addToCart(quote);

            // 2. Process Order from Cart (Note: moveToHistory is NOW in handleWhatsAppClick)
            const result = await processOrder(customer, false);

            if (result.success && result.folio) {
                setSubmittedQuote({ folio: result.folio, name: user.name });
                scrollToTicket();
            }
        } else {
            setModalOpen(true);
        }
    };

    // Phase 0 Bugfix: Move trackContact and moveToHistory to WhatsApp click
    // This ensures cart is only archived AFTER the user actually clicks WhatsApp
    const handleWhatsAppClick = () => {
        // Track the contact event
        trackContact("WhatsApp");

        // Now it's safe to move cart to history - user has committed to WhatsApp
        moveToHistory();
    };

    // Show empty state only if:
    // 1. Quote total is 0 (no valid calculation)
    // 2. No submitted quote exists (not in success state)
    // 3. Not currently processing (avoid flash during state transition)
    // 4. Cart is empty (double-check for edge cases)
    if (quote.total <= 0 && !submittedQuote && !isProcessing && cart.length === 0) {
        return (
            <div className={styles.emptyStateHint}>
                <p className={styles.hint}>
                    Completa los datos para ver la cotización.
                </p>
            </div>
        );
    }

    const handleReset = () => {
        clearSubmittedQuote();
        resetDraft();
    };

    const whatsappUrl = submittedQuote
        ? getWhatsAppUrl(
            env.NEXT_PUBLIC_WHATSAPP_NUMBER,
            `Hola, soy ${submittedQuote.name}. Acabo de generar la cotización Folio: ${submittedQuote.folio}. Me gustaría proceder con el pedido.`
        )
        : undefined;

    return (
        <div className={styles.container}>
            {/* Ticket - Using ref for scroll control and data attribute for test queries */}
            <div
                className={styles.ticketWrapper}
                data-ticket-container="true"
                ref={ticketRef}
            >
                <TicketDisplay
                    variant={submittedQuote ? "full" : "preview"}
                    quote={quote}
                    folio={submittedQuote?.folio}
                    customerName={submittedQuote?.name}
                />
            </div>

            {/* CTA Actions - Pre-submit vs Post-submit views */}
            <div className={styles.field}>
                {!submittedQuote ? (
                    <>
                        {warning && (
                            <div className={styles.warningNote}>
                                ⚠️{" "}
                                {warning.code === "BELOW_MINIMUM"
                                    ? "Pedido mínimo ajustado"
                                    : "Volumen redondeado"}
                            </div>
                        )}

                        <Button
                            fullWidth
                            variant="primary"
                            onClick={onContinue}
                            disabled={!isValid || isProcessing}
                        >
                            Solicitar Cotización por WhatsApp ({fmtMXN(quote.total)})
                        </Button>

                        <p className={styles.summaryFooter}>
                            Continúa para confirmar el pedido, descargar o
                            reenviar el cálculo.
                        </p>
                    </>
                ) : (
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
                                    // Build canonical shareable URL with folio for tracking
                                    const shareableUrl = `${window.location.origin}/?ref=shared&folio=${submittedQuote.folio}`;

                                    if (navigator.share) {
                                        navigator.share({
                                            title: `Cotización CEJ ${submittedQuote.folio}`,
                                            text: `Revisa mi cotización de concreto con folio ${submittedQuote.folio}`,
                                            url: shareableUrl,
                                        }).catch(console.error);
                                    } else {
                                        // Fallback: Copy to clipboard
                                        navigator.clipboard.writeText(shareableUrl);
                                        alert("Link copiado al portapapeles");
                                    }
                                }}
                            >
                                🔗 Compartir
                            </Button>
                        </div>

                        {/* User Data Edit: Allow changing contact info */}
                        {user.name && (
                            <button
                                onClick={() => setModalOpen(true)}
                                className={styles.editDataBtn}
                            >
                                ¿No eres {user.name}? Editar mis datos
                            </button>
                        )}

                        {/* Tertiary Actions: History and New Quote */}
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
                onSuccess={handleSuccess}
            />
        </div>
    );
}
