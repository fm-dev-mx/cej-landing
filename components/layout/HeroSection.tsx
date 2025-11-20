// components/layout/HeroSection.tsx

import { env } from "@/config/env";
import { LANDING_CONTENT } from "@/config/content";
import styles from "./HeroSection.module.scss";

type HeroSectionProps = {
  videoSrc?: string; // Path to video in /public or external URL
  fallbackImage?: string; // Image fallback
};

export default function HeroSection({
  videoSrc = "https://res.cloudinary.com/dwtk0d2dj/video/upload/v1763502599/hero-bg_vluny8.mp4",
  fallbackImage = "https://res.cloudinary.com/dwtk0d2dj/image/upload/v1763502640/hero-fallback_yokvg7.jpg",
}: HeroSectionProps) {
  const whatsappNumber = env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const content = LANDING_CONTENT.hero;

  // Predefined message for higher conversion
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
        "Hola, me interesa cotizar concreto y aprovechar el cálculo de volumetría gratis."
      )}`
    : undefined;

  return (
    <section className={styles.hero}>
      {/* Background Layer */}
      <div className={styles.hero__background}>
        <div className={styles.hero__overlay} />
        {videoSrc ? (
          <video
            className={styles.hero__video}
            autoPlay
            muted
            loop
            playsInline
            poster={fallbackImage}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : (
          // Fallback si no hay video configurado aún
          <div className={styles.hero__imagePlaceholder} />
        )}
      </div>

      {/* Content Layer */}
      <div className={styles.hero__container}>
        <div className={styles.hero__content}>
          <div className={styles.hero__badge}>
            <span className={styles.hero__badgeIcon}>✦</span>
            <span>{content.badge}</span>
          </div>

          <h1 className={styles.hero__title}>
            {content.title.line1} <br />
            <span className={styles.hero__highlight}>{content.title.highlight}</span>
          </h1>

          {/* Using dangerouslySetInnerHTML for the lead allows controlled bolding/formatting
            from the config without complex parsing logic.
            Ensure config/content.ts is treated as a trusted source.
          */}
          <p
            className={styles.hero__lead}
            dangerouslySetInnerHTML={{ __html: content.lead }}
          />

          {/* Trust Signals / Differentiators */}
          <ul className={styles.hero__features}>
            {content.features.map((feature, idx) => (
              <li key={idx} className={styles.hero__feature}>
                <CheckIcon />
                <span>
                  {feature.text} {feature.highlight && <strong>{feature.highlight}</strong>}
                </span>
              </li>
            ))}
          </ul>

          <div className={styles.hero__actions}>
            <a href="#calculator" className={styles.hero__btnPrimary}>
              {content.cta.primary}
            </a>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.hero__btnSecondary}
              >
                <span className={styles.hero__iconWa}>💬</span>
                {content.cta.secondary}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Componente simple de ícono para no depender de librerías externas
function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--c-accent)" /* Usa el amarillo neón */
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
