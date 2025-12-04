// components/Calculator/steps/Step5Summary.tsx
'use client';

import { useMemo, useCallback, type MouseEvent } from "react";
import { useCalculatorContext } from "../context/CalculatorContext";
import { fmtMXN, getWhatsAppUrl, getPhoneUrl } from "@/lib/utils";
import { trackLead, trackContact } from "@/lib/pixel";
import { env } from "@/config/env";
import { Button } from "@/components/ui/Button/Button";
import styles from "../Calculator.module.scss";

type Props = {
    estimateLegend: string;
};

export function Step5Summary({ estimateLegend }: Props) {
    const {
        billedM3,
        quote,
        unitPriceLabel,
        volumeError,
        setStep,
        resetCalculator,
        strength,
        type,
    } = useCalculatorContext();

    const today = new Date().toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    const waNumber = env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    const phone = env.NEXT_PUBLIC_PHONE;

    const phoneHref = getPhoneUrl(phone);

    const whatsappMessage = useMemo(() => {
        return (
            `Hola, me interesa esta cotización de CEJ:\n\n` +
            `🔹 *Volumen:* ${billedM3.toFixed(2)} m³\n` +
            `🔹 *Producto:* Concreto f’c ${strength} (${type === "direct" ? "Tiro directo" : "Bombeado"
            })\n` +
            `🔹 *Total Estimado:* ${fmtMXN(quote.total)}\n\n` +
            `¿Me pueden ayudar a confirmar el pedido?`
        );
    }, [billedM3, strength, type, quote.total]);

    // Generate URL using helper
    const waHref = getWhatsAppUrl(waNumber, whatsappMessage);
    const waDisabled = !waHref;

    const handleWhatsAppClick = useCallback(
        (e?: MouseEvent<HTMLElement>) => {
            if (waDisabled || quote.total <= 0 || !waHref) {
                e?.preventDefault();
                return;
            }

            // High Value Event: Track Lead with financial data
            trackLead({
                value: quote.total,
                currency: 'MXN',
                content_name: `Concrete f'c ${strength} - ${type}`,
                content_category: 'Calculator Quote'
            });

            window.open(waHref, "_blank", "noopener,noreferrer");
        },
        [waDisabled, waHref, quote.total, strength, type]
    );

    const handlePhoneClick = useCallback(() => {
        if (phone.trim() && quote.total > 0) {
            // Track as Contact (Mid Value) since it's just a call intent
            trackContact('Phone');
        }
    }, [phone, quote.total]);

    return (
        <div className={`${styles.step} ${styles.stepAnimated}`}>
            <header className={styles.stepHeader}>
                <h2 className={styles.stepTitle}>Cotización Lista</h2>
                <p className={styles.stepSubtitle}>
                    Revisa el detalle y contáctanos para agendar tu pedido.
                </p>
            </header>

            <div className={styles.stepBody}>
                {/* Visual "Paper Ticket" Representation */}
                <article
                    className={styles.ticketCard}
                    aria-label="Desglose de cotización"
                >
                    <div className={styles.ticketContent}>
                        <div className={styles.ticketHeader}>
                            <span className={styles.ticketLabel}>Presupuesto Web</span>
                            <time
                                className={styles.ticketDate}
                                dateTime={new Date().toISOString().split("T")[0]}
                                suppressHydrationWarning
                            >
                                {today}
                            </time>
                        </div>

                        <div className={styles.ticketSection}>
                            <h3 className={styles.ticketSectionTitle}>
                                Detalles del Pedido
                            </h3>
                            <div className={styles.specGrid}>
                                <div className={styles.specItem}>
                                    <span className={styles.specLabel}>Resistencia</span>
                                    <span className={styles.specValue}>f’c {strength}</span>
                                </div>
                                <div className={styles.specItem}>
                                    <span className={styles.specLabel}>Tipo Servicio</span>
                                    <span className={styles.specValue}>
                                        {type === "direct" ? "Tiro Directo" : "Bombeado"}
                                    </span>
                                </div>
                                <div className={styles.specItem}>
                                    <span className={styles.specLabel}>Volumen</span>
                                    <span className={styles.specValue}>
                                        {billedM3.toFixed(2)} m³
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.ticketRows}>
                            <div className={styles.row}>
                                <span className={styles.rowLabel}>Precio Unitario</span>
                                <span className={styles.rowValue}>{unitPriceLabel}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.rowLabel}>Subtotal</span>
                                <span className={styles.rowValue}>
                                    {fmtMXN(quote.subtotal)}
                                </span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.rowLabel}>IVA (8%)</span>
                                <span className={styles.rowValue}>{fmtMXN(quote.vat)}</span>
                            </div>
                        </div>

                        <div className={styles.ticketTotal}>
                            <span className={styles.totalLabel}>Total</span>
                            <span className={styles.totalValue}>{fmtMXN(quote.total)}</span>
                        </div>
                    </div>
                </article>

                {billedM3 === 0 && !volumeError && (
                    <div className={styles.error} role="alert">
                        Faltan datos para completar el cálculo.
                    </div>
                )}

                <div className={styles.actionsGroup}>
                    <div className={styles.primaryActions}>
                        <Button
                            type="button"
                            variant="whatsapp"
                            onClick={handleWhatsAppClick}
                            disabled={waDisabled || quote.total <= 0}
                            fullWidth
                            className={styles.actionButton}
                        >
                            Agendar por WhatsApp
                        </Button>

                        {phoneHref && (
                            <Button
                                variant="secondary"
                                href={phoneHref}
                                onClick={handlePhoneClick}
                                fullWidth
                                className={styles.actionButton}
                            >
                                Llamar ahora
                            </Button>
                        )}
                    </div>

                    <div className={styles.secondaryLinks}>
                        <button
                            type="button"
                            className={styles.textLink}
                            onClick={() => setStep(4)}
                            aria-label="Volver a editar especificaciones"
                        >
                            <span>←</span> Editar
                        </button>

                        <span className={styles.linkSeparator} aria-hidden="true">
                            •
                        </span>

                        <button
                            type="button"
                            className={styles.textLink}
                            onClick={resetCalculator}
                            aria-label="Iniciar una nueva cotización desde cero"
                        >
                            <span>↺</span> Nueva cotización
                        </button>
                    </div>
                </div>

                <p className={styles.disclaimer}>{estimateLegend}</p>
            </div>
        </div>
    );
}
