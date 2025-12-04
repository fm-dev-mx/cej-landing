// components/CTAButtons/CTAButtons.tsx
"use client";

import { useMemo } from "react";
import { getWhatsAppUrl, getPhoneUrl } from "@/lib/utils";
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
  const links = useMemo(() => {
    return {
      wa: getWhatsAppUrl(whatsappNumber, quoteText),
      tel: getPhoneUrl(phoneNumber),
    };
  }, [whatsappNumber, phoneNumber, quoteText]);

  if (!links.wa && !links.tel) return null;

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
          onClick={onLead}
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
          onClick={onContact}
          aria-label="Llamar por teléfono"
        >
          <span aria-hidden="true">📞</span> Llamar
        </a>
      )}
    </div>
  );
}
