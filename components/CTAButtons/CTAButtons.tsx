// components/CTAButtons/CTAButtons.tsx

"use client";
import styles from "./CTAButtons.module.scss";

type Props = {
  whatsappNumber: string;  // E.164 ej. 526561234567
  phoneNumber: string;     // E.164
  quoteText?: string;      // "Cotización CEJ … Total: $X MXN"
  onLead?: () => void;     // Meta Pixel Lead
  onContact?: () => void;  // Meta Pixel Contact
  sticky?: boolean;
};

export default function CTAButtons({
  whatsappNumber,
  phoneNumber,
  quoteText = "Cotización CEJ",
  onLead,
  onContact,
  sticky = true,
}: Props) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(quoteText)}`;
  const telHref = `tel:+${phoneNumber}`;

  return (
    <div className={sticky ? styles.stickyBar : styles.inlineGroup} role="group" aria-label="Contactar a CEJ">
      <a
        className={`${styles.cta} ${styles.whatsapp}`}
        href={waHref}
        onClick={onLead}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span aria-hidden>💬</span> WhatsApp
      </a>
      <a
        className={`${styles.cta} ${styles.phone}`}
        href={telHref}
        onClick={onContact}
      >
        <span aria-hidden>📞</span> Llamar
      </a>
    </div>
  );
}
