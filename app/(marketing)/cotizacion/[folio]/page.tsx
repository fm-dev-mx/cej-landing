// app/(marketing)/cotizacion/[folio]/page.tsx
// Description: Focused shared view for a specific quote folio.
// Dynamic route that fetches data on-demand from Supabase.

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TicketDisplay } from '@/components/Calculator/TicketDisplay/TicketDisplay';
import { getQuoteByFolio } from '@/app/actions/getQuoteByFolio';
import { env } from '@/config/env';
import { getWhatsAppUrl } from '@/lib/utils';
import { SharedQuoteActions } from './SharedQuoteActions';
import styles from './SharedQuote.module.scss';

interface Props {
    params: Promise<{ folio: string }>;
}

/**
 * Generate dynamic SEO metadata and OG tags for WhatsApp previews.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { folio } = await params;
    const quote = await getQuoteByFolio(folio);

    if (!quote) {
        return {
            title: "Cotización no encontrada",
            robots: "noindex, nofollow",
        };
    }

    const totalStr = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: quote.financials.currency || 'MXN'
    }).format(quote.financials.total);

    return {
        title: `Cotización ${folio} | ${env.NEXT_PUBLIC_BRAND_NAME}`,
        description: `Detalle de cotización para concreto premezclado. Folio: ${folio}. Total: ${totalStr}`,
        robots: "noindex, nofollow",
        openGraph: {
            title: `Cotización Folio: ${folio}`,
            description: `Revisa los detalles de tu presupuesto de concreto. Total: ${totalStr}`,
            type: 'website',
            images: [
                {
                    url: `${env.NEXT_PUBLIC_SITE_URL}/og-image.jpg`, // Reuse existing branded OG image
                    width: 1200,
                    height: 630,
                    alt: env.NEXT_PUBLIC_BRAND_NAME,
                }
            ]
        }
    };
}

export default async function SharedQuotePage({ params }: Props) {
    const { folio } = await params;
    const quote = await getQuoteByFolio(folio);

    if (!quote) {
        notFound();
    }

    const whatsappUrl = getWhatsAppUrl(
        env.NEXT_PUBLIC_WHATSAPP_NUMBER,
        `Hola, estoy revisando la cotización con folio: ${folio}. Me interesa programar una entrega.`
    );

    return (
        <div className={styles.pageWrapper}>
            <article className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Tu Cotización</h1>
                    <p className={styles.subtitle}>Referencia: {folio}</p>
                </header>

                <section className={styles.ticketContainer}>
                    <TicketDisplay
                        variant="full"
                        quote={quote}
                        folio={folio}
                        customerName={quote.customer?.name}
                        className={styles.ticketOverride}
                    />
                </section>

                <section className={styles.actions}>
                    <SharedQuoteActions
                        whatsappUrl={whatsappUrl}
                        folio={folio}
                    />

                    <div className={styles.trustBanner}>
                        <p>✓ Precios competitivos ✓ Entrega puntual ✓ Calidad certificada</p>
                    </div>
                </section>

                <footer className={styles.footer}>
                    <p>© {new Date().getFullYear()} {env.NEXT_PUBLIC_BRAND_NAME}. Todos los derechos reservados.</p>
                </footer>
            </article>
        </div>
    );
}
