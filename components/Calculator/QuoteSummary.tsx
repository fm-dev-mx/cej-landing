// components/Calculator/QuoteSummary.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useCejStore } from '@/store/useCejStore';
import { useQuoteCalculator } from '@/hooks/useQuoteCalculator';
import { useCheckoutUI } from '@/hooks/useCheckOutUI';
import { TicketDisplay } from './TicketDisplay/TicketDisplay';
import { SchedulingModal } from './modals/SchedulingModal';
import { QuoteCTA } from './QuoteCTA';
import { Button } from '@/components/ui/Button/Button';
import { trackContact } from '@/lib/tracking/visitor';

import { getWhatsAppUrl } from '@/lib/utils';
import { env } from '@/config/env';
import { getCalculatorSteps } from '@/lib/progress';
import { FALLBACK_PRICING_RULES } from '@/config/business';
import { getPriceConfig } from '@/app/actions/getPriceConfig';
import { type PricingRules } from '@/lib/schemas/pricing';

import styles from './CalculatorForm.module.scss';

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

    // Live Pricing State
    const [liveRules, setLiveRules] = useState<PricingRules | undefined>(undefined);

    // Fetch live pricing on mount
    useEffect(() => {
        const fetchPricing = async () => {
            const rules = await getPriceConfig();
            setLiveRules(rules);
        };
        fetchPricing();
    }, []);

    const { quote: currentQuote, isValid, warning } = useQuoteCalculator(draft, liveRules);

    // Display Quote: Submitted one OR Current Draft
    const quote = submittedQuote ? submittedQuote.results : currentQuote;
    const { isProcessing } = useCheckoutUI();

    const [isSchedulingOpen, setSchedulingOpen] = useState(false);
    const ticketRef = useRef<HTMLDivElement>(null);

    const scrollToTicket = () => {
        setTimeout(() => {
            ticketRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }, 100);
    };

    // --- Handlers ---

    const handleViewBreakdown = () => {
        setBreakdownViewed(true);
        scrollToTicket();
    };

    const handleSchedulingSuccess = (folio: string, name: string) => {
        setSubmittedQuote({
            folio,
            name,
            results: currentQuote
        });

        const itemId = addToCart(currentQuote, false);
        if (name && user.phone) {
            updateCartItemCustomer(itemId, { name, phone: user.phone });
            updateCartItemFolio(itemId, folio);
        }

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
        if (draft.mode === 'knownM3') {
            useCejStore.getState().updateDraft({
                m3: '',
                strength: null,
                type: null,
                additives: []
            });
        } else {
            useCejStore.getState().updateDraft({
                workType: null,
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
        onScrollToTop?.();
    };

    const handleEditCalculation = () => {
        setBreakdownViewed(false);
    };

    // --- Render Logic ---

    const stage: 'preview' | 'actions' | 'submitted' = (submittedQuote && !!submittedQuote.folio)
        ? 'submitted'
        : breakdownViewed
            ? 'actions'
            : 'preview';


    const isViewingHistory = !!submittedQuote;
    const whatsappUrl = submittedQuote
        ? getWhatsAppUrl(
            env.NEXT_PUBLIC_WHATSAPP_NUMBER,
            `Hola, soy ${submittedQuote.name}. Folio confirmación: ${submittedQuote.folio}.`
        )
        : undefined;

    const currentRulesVersion = liveRules?.version ?? FALLBACK_PRICING_RULES.version;
    const isVersionMismatch = isViewingHistory && quote?.pricingSnapshot
        ? quote.pricingSnapshot.rules_version < currentRulesVersion
        : false;

    return (
        <div className={styles.container}>
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
                        isVersionMismatch={isVersionMismatch}
                    />
                </div>
            )}

            <div className={styles.field}>
                {stage === 'preview' && (
                    <>
                        <Button
                            fullWidth
                            variant="primary"
                            onClick={handleViewBreakdown}
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

                {stage === 'actions' && (
                    <div className={styles.animateFadeIn}>
                        {liveRules && liveRules.version > FALLBACK_PRICING_RULES.version && (
                            <div className={styles.livePriceBadge}>
                                ✨ Precios actualizados ✨
                            </div>
                        )}
                        <div className={styles.successActions}>
                            {isVersionMismatch && (
                                <div className={styles.versionAlertPrompt}>
                                    <Button
                                        fullWidth
                                        variant="secondary"
                                        className={styles.updatePricesBtn}
                                        onClick={() => {
                                            clearSubmittedQuote();
                                            setBreakdownViewed(true);
                                        }}
                                    >
                                        🔄 Actualizar a precios actuales
                                    </Button>
                                </div>
                            )}

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

                            <QuoteCTA quote={quote} />



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
                            <Button
                                fullWidth
                                variant="secondary"
                                onClick={() => {
                                    const url = `${window.location.origin}/cotizacion/${submittedQuote?.folio}`;
                                    navigator.clipboard.writeText(url);
                                    alert("Enlace de cotización copiado");
                                }}
                            >
                                🔗 Compartir
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
                quote={currentQuote}
                onSuccess={handleSchedulingSuccess}
            />
        </div >
    );
}
