'use client';

import { useState } from 'react';
import { useCejStore } from '@/store/useCejStore';
import { useQuoteCalculator } from '@/hooks/useQuoteCalculator';

import { TicketDisplay } from '../TicketDisplay/TicketDisplay';
import { LeadFormModal } from '../modals/LeadFormModal';
import { Button } from '@/components/ui/Button/Button';

import { fmtMXN, getWhatsAppUrl } from '@/lib/utils';
import { env } from '@/config/env';

import styles from '../CalculatorForm.module.scss';

export function Step5Summary() {
    const draft = useCejStore((s) => s.draft);
    const resetDraft = useCejStore((s) => s.resetDraft);

    const { quote, isValid, warning } = useQuoteCalculator(draft);

    const [isModalOpen, setModalOpen] = useState(false);
    const [submittedData, setSubmittedData] = useState<{ folio: string; name: string } | null>(null);

    if (quote.total <= 0) {
        return (
            <div className={styles.emptyStateHint}>
                <p className={styles.hint}>Completa los datos para ver la cotización.</p>
            </div>
        );
    }

    const handleSuccess = (folio: string, name: string) => {
        setSubmittedData({ folio, name });
        setModalOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleReset = () => {
        setSubmittedData(null);
        resetDraft();
    };

    // Correct usage: send to the WhatsApp sales number
    const whatsappUrl = submittedData
        ? getWhatsAppUrl(
            env.NEXT_PUBLIC_WHATSAPP_NUMBER,
            `Hola, soy ${submittedData.name}. Acabo de generar la cotización Folio: ${submittedData.folio}. Me gustaría proceder con el pedido.`
        )
        : undefined;

    return (
        <div className={styles.container}>
            {/* Ticket */}
            <div style={{ marginBlock: '2rem' }}>
                <TicketDisplay
                    variant={submittedData ? 'full' : 'preview'}
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
                            <div className={styles.note} style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                ⚠️ {warning.code === 'BELOW_MINIMUM' ? 'Pedido mínimo ajustado' : 'Volumen redondeado'}
                            </div>
                        )}

                        <Button fullWidth variant="primary" onClick={() => setModalOpen(true)} disabled={!isValid}>
                            Ver Cotización Formal ({fmtMXN(quote.total)})
                        </Button>

                        <p className={styles.summaryFooter}>Recibe el desglose oficial en tu WhatsApp.</p>
                    </>
                ) : (
                    <>
                        <Button fullWidth variant="whatsapp" href={whatsappUrl} target="_blank">
                            Confirmar Pedido por WhatsApp
                        </Button>

                        <button
                            onClick={handleReset}
                            className={styles.textBtnPrimary}
                            style={{ display: 'block', margin: '1rem auto' }}
                        >
                            Nueva Cotización
                        </button>
                    </>
                )}
            </div>

            <LeadFormModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSuccess={handleSuccess} />
        </div>
    );
}
