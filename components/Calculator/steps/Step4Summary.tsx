// components/Calculator/steps/Step4Summary.tsx
'use client';

import { useMemo, useCallback, type MouseEvent } from "react";
import { useCalculatorContext } from "../context/CalculatorContext";
import { fmtMXN } from "@/lib/utils";
import { trackLead, trackContact } from "@/lib/pixel";
import { env } from "@/config/env";
import styles from "../Calculator.module.scss";

type Props = {
  estimateLegend: string;
};

export function Step4Summary({ estimateLegend }: Props) {
  const {
    billedM3,
    requestedM3,
    quote,
    unitPriceLabel,
    volumeError,
    setStep,
    modeLabel,
    hasCoffered,
    cofferedSize,
    strength,
    type
  } = useCalculatorContext();

  // --- Contact & Tracking Logic ---

  const waNumber = env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const phone = env.NEXT_PUBLIC_PHONE;
  const waDisabled = waNumber.trim().length === 0;
  const phoneHref = phone.trim() ? `tel:${phone.trim().replace(/\s+/g, "")}` : "";

  // Generate WhatsApp message string
  const whatsappText = useMemo(() => {
    const cofferedDetail =
      hasCoffered === 'yes' && cofferedSize
        ? ` (Casetón ${cofferedSize}cm)`
        : hasCoffered === 'yes'
        ? ' (Aligerada)'
        : '';

    return encodeURIComponent(
      `Cotización CEJ\n` +
      `Modo: ${modeLabel}${cofferedDetail}\n` +
      `Volumen solicitado: ${requestedM3.toFixed(2)} m³\n` +
      `Volumen facturable: ${billedM3.toFixed(2)} m³\n` +
      `Precio por m³: ${unitPriceLabel}\n` +
      `f’c: ${strength} kg/cm²\n` +
      `Tipo: ${type === 'direct' ? 'Tiro directo' : 'Bombeado'}\n` +
      `Subtotal: ${fmtMXN(quote.subtotal)}\n` +
      `IVA 8%: ${fmtMXN(quote.vat)}\n` +
      `Total: ${fmtMXN(quote.total)}`
    );
  }, [
    modeLabel, hasCoffered, cofferedSize, requestedM3, billedM3,
    unitPriceLabel, strength, type, quote
  ]);

  const handleWhatsAppClick = useCallback((e?: MouseEvent<HTMLButtonElement>) => {
    if (waDisabled || quote.total <= 0) {
      e?.preventDefault();
      return;
    }
    trackLead(quote.total);
    window.open(
      `https://wa.me/${waNumber}?text=${whatsappText}`,
      '_blank',
      'noopener,noreferrer'
    );
  }, [waDisabled, waNumber, whatsappText, quote.total]);

  const handlePhoneClick = useCallback(() => {
    if (phone.trim() && quote.total > 0) {
      trackContact(quote.total);
    }
  }, [phone, quote.total]);

  return (
    <div className={`${styles.step} ${styles.stepAnimated}`}>
      <header className={styles.stepHeader}>
        <span className={styles.stepBadge}>4</span>
        <h2 className={styles.stepTitle}>Tu cotización estimada</h2>
      </header>

      <div className={styles.stepBody}>
        <aside className={styles.totalCard} aria-live="polite">
          <div className={styles.rows}>
            <div className={styles.row}>
              <span className={styles.muted}>Volumen</span>
              <strong className={styles.amount}>
                {billedM3.toFixed(2)} m³
              </strong>
            </div>
            <div className={styles.row}>
              <span className={styles.muted}>Precio por m³</span>
              <strong className={styles.amount}>{unitPriceLabel}</strong>
            </div>
            <div className={styles.row}>
              <span className={styles.muted}>Subtotal</span>
              <strong className={styles.amount}>
                {fmtMXN(quote.subtotal)}
              </strong>
            </div>
            <div className={styles.row}>
              <span className={styles.muted}>IVA 8%</span>
              <strong className={styles.amount}>
                {fmtMXN(quote.vat)}
              </strong>
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.grand}>Total</span>
            <span className={`${styles.grand} ${styles.amount}`}>
              {fmtMXN(quote.total)}
            </span>
          </div>

          <div
            className={styles.actions}
            role="group"
            aria-label="Contactar a CEJ"
          >
            <button
              type="button"
              onClick={handleWhatsAppClick}
              disabled={waDisabled || quote.total <= 0}
            >
              💬 WhatsApp
            </button>

            {phoneHref && (
              <a
                href={phoneHref}
                onClick={handlePhoneClick}
              >
                📞 Llamar
              </a>
            )}
          </div>
        </aside>

        {billedM3 === 0 && !volumeError && (
          <p className={styles.note}>
            Faltan datos para completar el cálculo.
          </p>
        )}

        <div className={styles.stepControls}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => setStep(3)}
          >
            Editar especificaciones
          </button>
        </div>

        <p className={styles.disclaimer}>{estimateLegend}</p>
      </div>
    </div>
  );
}
