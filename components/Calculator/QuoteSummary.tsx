// components/Calculator/QuoteSummary.tsx
'use client';

import { useState, useRef } from 'react';
import { useCejStore } from '@/store/useCejStore';
import { useQuoteCalculator } from '@/hooks/useQuoteCalculator';
import { useCheckoutUI } from '@/hooks/useCheckOutUI';
import { TicketDisplay } from './TicketDisplay/TicketDisplay';
import { LeadFormModal } from './modals/LeadFormModal';
import { Button } from '@/components/ui/Button/Button';

import { fmtMXN, getWhatsAppUrl } from '@/lib/utils';
import { env } from '@/config/env';

import styles from './CalculatorForm.module.scss';

export function QuoteSummary() {
    const draft = useCejStore((s) => s.draft);
    const resetDraft = useCejStore((s) => s.resetDraft);
    const user = useCejStore((s) => s.user);

    const { quote, isValid, warning } = useQuoteCalculator(draft);
    const { processOrder, isProcessing } = useCheckoutUI();

    const [isModalOpen, setModalOpen] = useState(false);
    const [submittedData, setSubmittedData] = useState<{
        folio: string;
        name: string;
    } | null>(null);

    // Use ref instead of document.querySelector for React best practices
    const ticketRef = useRef<HTMLDivElement>(null);

    if (quote.total <= 0) {
        return (
            <div className={styles.emptyStateHint}>
                <p className={styles.hint}>
                    Completa los datos para ver la cotización.
                </p>
            </div>
        );
    }

    const scrollToTicket = () => {
        // Timeout ensures rendering allows smooth scroll, but using ref targets the specific element securely
        setTimeout(() => {
            ticketRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }, 100);
    };

    const handleSuccess = (folio: string, name: string) => {
        setSubmittedData({ folio, name });
        setModalOpen(false);
        scrollToTicket();
    };

    const onContinue = async () => {
        // Reuse data if available
        if (user.name && user.phone) {
            const customer = { name: user.name, phone: user.phone };
            const success = await processOrder(customer, false);
            if (success) {
                // Pre-filled by store, opening purely to confirm/verify details
                setModalOpen(true);
            }
        } else {
            setModalOpen(true);
        }
    };

    const handleReset = () => {
        setSubmittedData(null);
        resetDraft();
    };

    const whatsappUrl = submittedData
        ? getWhatsAppUrl(
            env.NEXT_PUBLIC_WHATSAPP_NUMBER,
            `Hola, soy ${submittedData.name}. Acabo de generar la cotización Folio: ${submittedData.folio}. Me gustaría proceder con el pedido.`
        )
        : undefined;

    return (
        <div className={styles.container}>
            {/* Ticket - Added ref and kept data attribute for tests */}
            <div
                style={{ marginBlock: "2rem" }}
                data-ticket-container="true"
                ref={ticketRef}
            >
                <TicketDisplay
                    variant={submittedData ? "full" : "preview"}
                    quote={quote}
                    folio={submittedData?.folio}
                    customerName={submittedData?.name}
                />
            </div>

            {/* Actions */}
            <div className={styles.field}>
                {!submittedData ? (
                    <>
                        {warning && (
                            <div
                                className={styles.note}
                                style={{
                                    textAlign: "center",
                                    marginBottom: "1rem",
                                }}
                            >
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
                            Continuar con mi cotización ({fmtMXN(quote.total)})
                        </Button>

                        <p className={styles.summaryFooter}>
                            Continúa para confirmar el pedido, descargar o
                            reenviar el cálculo.
                        </p>
                    </>
                ) : (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem",
                        }}
                    >
                        {/* Primary: WhatsApp */}
                        <Button
                            fullWidth
                            variant="whatsapp"
                            href={whatsappUrl}
                            target="_blank"
                        >
                            Enviar por WhatsApp al equipo CEJ
                        </Button>
                        <p
                            className={styles.hint}
                            style={{ textAlign: "center", margin: 0 }}
                        >
                            Envío instantáneo al equipo de ventas
                        </p>

                        {/* Secondary Actions Row */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "0.75rem",
                                marginTop: "0.5rem",
                            }}
                        >
                            <Button
                                fullWidth
                                variant="secondary"
                                onClick={() => alert("Próximamente: PDF")}
                            >
                                📄 Descargar PDF
                            </Button>
                            <Button
                                fullWidth
                                variant="secondary"
                                onClick={() => alert("Próximamente: Compartir")}
                            >
                                🔗 Compartir
                            </Button>
                        </div>

                        {/* Tertiary: History */}
                        <button
                            onClick={() => alert("Próximamente: Historial")}
                            className={styles.textBtnPrimary}
                            style={{ display: "block", margin: "0.5rem auto" }}
                        >
                            📂 Ver mis cotizaciones
                        </button>

                        <button
                            onClick={handleReset}
                            className={styles.textBtn}
                            style={{
                                display: "block",
                                margin: "0 auto",
                                fontSize: "0.85rem",
                            }}
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
