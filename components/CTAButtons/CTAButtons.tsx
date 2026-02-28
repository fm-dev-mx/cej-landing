// components/CTAButtons/CTAButtons.tsx
"use client";

import { useMemo, useCallback } from "react";
import { getWhatsAppUrl } from "@/lib/utils";
import { trackContact } from "@/lib/tracking/visitor";
import { usePublicStore } from "@/store/public/usePublicStore";
import styles from "./CTAButtons.module.scss";

type Props = {
  whatsappNumber: string;
  quoteText?: string;
  scheduleHref?: string;
  onLead?: () => void;
  onSchedule?: () => void;
  sticky?: boolean;
};

export default function CTAButtons({
  whatsappNumber,
  quoteText = "Hola, me interesa cotizar concreto.",
  scheduleHref = "#calculator",
  onLead,
  onSchedule,
  sticky = true,
}: Props) {
  // Store: Hide this bar if cart has items (SmartBar takes priority)
  const cartLength = usePublicStore(s => s.cart.length);
  const shouldHide = cartLength > 0 && sticky;

  const links = useMemo(() => {
    return {
      wa: getWhatsAppUrl(whatsappNumber, quoteText),
    };
  }, [whatsappNumber, quoteText]);

  const handleWhatsAppClick = useCallback(() => {
    trackContact('WhatsApp');
    if (onLead) onLead();
  }, [onLead]);

  const handleScheduleClick = useCallback(() => {
    if (onSchedule) onSchedule();
  }, [onSchedule]);

  if (!links.wa || shouldHide) return null;

  return (
    <div
      className={sticky ? styles.stickyBar : styles.inlineGroup}
      role="group"
      aria-label="Opciones de acción rápidas"
    >
      <a
        className={`${styles.cta} ${styles.schedule}`}
        href={scheduleHref}
        onClick={handleScheduleClick}
        aria-label="Programar pedido"
      >
        <span aria-hidden="true">📅</span> Programar Pedido
      </a>

      {links.wa && (
        <a
          className={`${styles.cta} ${styles.whatsapp}`}
          href={links.wa}
          onClick={handleWhatsAppClick}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp"
        >
          <span aria-hidden="true">💬</span> WhatsApp
        </a>
      )}
    </div>
  );
}
