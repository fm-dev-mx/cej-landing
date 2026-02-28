'use client';

import { Button } from '@/components/ui/Button/Button';
import { generateQuoteId, getWhatsAppUrl, buildQuoteMessage } from '@/lib/utils';
import { env } from '@/config/env';
import { trackContact, trackInitiateCheckout } from '@/lib/tracking/visitor';
import type { QuoteBreakdown } from '@/types/domain';
import styles from './QuoteCTA.module.scss';

interface QuoteCTAProps {
    quote: QuoteBreakdown;
    onOpenForm?: () => void;
}

export function QuoteCTA({ quote, onOpenForm }: QuoteCTAProps) {
    /**
     * Path A — WhatsApp direct (no form, no server call).
     * Generates a folio on the client for reference tracking.
     */
    const handleWhatsAppDirect = () => {
        const folio = generateQuoteId();
        const message = buildQuoteMessage(quote, folio);
        const url = getWhatsAppUrl(env.NEXT_PUBLIC_WHATSAPP_NUMBER, message);
        trackContact('WhatsApp_Direct');
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
    };

    /**
     * Path B — Open the existing form (handled by parent via useCheckoutUI).
     * Fires InitiateCheckout mid-funnel event before opening the form.
     */
    const handleOpenForm = () => {
        trackInitiateCheckout({ value: quote.total });
        onOpenForm?.();
    };

    return (
        <div className={styles.ctaWrapper}>
            <div className={styles.divider}>O BIEN</div>

            <h3 className={styles.title}>¿Prefieres atención inmediata?</h3>
            <p className={styles.description}>
                Envía tus datos por WhatsApp y un asesor te atenderá sin llenar formularios.
            </p>

            <Button
                variant="whatsapp"
                fullWidth
                onClick={handleWhatsAppDirect}
            >
                📱 Consultar por WhatsApp
            </Button>

            {onOpenForm && (
                <div className={styles.secondaryCta}>
                    <p className={styles.secondaryLabel}>¿Prefieres que te contactemos?</p>
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={handleOpenForm}
                    >
                        Enviar mis datos
                    </Button>
                </div>
            )}
        </div>
    );
}
