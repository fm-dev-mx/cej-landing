// components/CTAButtons/CTAButtons.tsx
"use client";

import { useMemo, useCallback } from "react";
import { getWhatsAppUrl, getPhoneUrl } from "@/lib/utils";
import { trackContact } from "@/lib/tracking/visitor";
import { useCejStore } from "@/store/useCejStore";
import styles from "./CTAButtons.module.scss";

type Props = {
  whatsappNumber: string;
  phoneNumber: string;
  quoteText?: string;
  onLead?: () => void;
  onContact?: () => void;
  sticky?: boolean;
};

export default function CTAButtons({
  whatsappNumber,
  phoneNumber,
  quoteText = "Hola, me interesa cotizar concreto.",
  onLead,
  onContact,
  sticky = true,
}: Props) {
  // Store: Hide this bar if cart has items (SmartBar takes priority)
  const cartLength = useCejStore(s => s.cart.length);
  const shouldHide = cartLength > 0 && sticky;

  const links = useMemo(() => {
    return {
      wa: getWhatsAppUrl(whatsappNumber, quoteText),
      tel: getPhoneUrl(phoneNumber),
    };
  }, [whatsappNumber, phoneNumber, quoteText]);

  const handleWhatsAppClick = useCallback(() => {
    trackContact('WhatsApp');
    if (onLead) onLead();
  }, [onLead]);

  const handlePhoneClick = useCallback(() => {
    trackContact('Phone');
    if (onContact) onContact();
  }, [onContact]);

  if ((!links.wa && !links.tel) || shouldHide) return null;

  return (
    <div
      className={sticky ? styles.stickyBar : styles.inlineGroup}
      role="group"
      aria-label="Opciones de contacto"
    >
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
      {links.tel && (
        <a
          className={`${styles.cta} ${styles.phone}`}
          href={links.tel}
          onClick={handlePhoneClick}
          aria-label="Llamar por teléfono"
        >
          <span aria-hidden="true">📞</span> Llamar
        </a>
      )}
    </div>
  );
}
