'use client';

import { useCejStore } from '@/store/useCejStore';
import { Button } from '@/components/ui/Button/Button';
import { getWhatsAppUrl, buildDirectQuoteMessage } from '@/lib/utils';
import { env } from '@/config/env';
import { trackContact } from '@/lib/tracking/visitor';
import type { QuoteBreakdown } from '@/types/domain';
import styles from './QuoteCTA.module.scss';

interface QuoteCTAProps {
    quote: QuoteBreakdown;
}

export function QuoteCTA({ quote }: QuoteCTAProps) {
    const moveToHistory = useCejStore((s) => s.moveToHistory);

    const message = buildDirectQuoteMessage(quote);
    const whatsappUrl = getWhatsAppUrl(env.NEXT_PUBLIC_WHATSAPP_NUMBER, message);

    const handleClick = () => {
        trackContact('WhatsApp_Direct');
        moveToHistory();
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
                href={whatsappUrl}
                target="_blank"
                onClick={handleClick}
            >
                WhatsApp Directo
            </Button>
        </div>
    );
}
