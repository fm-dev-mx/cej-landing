// app/(marketing)/cotizacion/[folio]/SharedQuoteActions.tsx
"use client";

import { Button } from "@/components/ui/Button/Button";
import { trackContact } from "@/lib/tracking/visitor";
import styles from './SharedQuote.module.scss';

interface SharedQuoteActionsProps {
    whatsappUrl?: string;
    folio: string;
}

export function SharedQuoteActions({ whatsappUrl, folio }: SharedQuoteActionsProps) {
    const handleWhatsAppClick = () => {
        trackContact("WhatsApp");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Button
                fullWidth
                variant="whatsapp"
                href={whatsappUrl}
                target="_blank"
                onClick={handleWhatsAppClick}
            >
                📅 Programar con este folio
            </Button>

            <div className={styles.secondaryActions}>
                <Button
                    variant="secondary"
                    onClick={handlePrint}
                >
                    📄 Descargar PDF
                </Button>
                <Button
                    variant="primary"
                    href="/"
                >
                    🏠 Nueva Cotización
                </Button>
            </div>
        </>
    );
}
