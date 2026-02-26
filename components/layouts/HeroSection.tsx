// components/layouts/HeroSection.tsx

import { env, isProd } from "@/config/env";
import { LANDING_CONTENT } from "@/config/content";
import { getWhatsAppUrl } from "@/lib/utils";
import { getCloudinaryUrl } from "@/lib/cloudinary";
import styles from "./HeroSection.module.scss";

type HeroSectionProps = {
  videoSrc?: string;
  fallbackImage?: string;
};

export default function HeroSection({
  videoSrc = getCloudinaryUrl("https://res.cloudinary.com/dwtk0d2dj/video/upload/v1763502599/hero-bg_vluny8.mp4", 'video'),
  fallbackImage = getCloudinaryUrl("https://res.cloudinary.com/dwtk0d2dj/image/upload/v1763502640/hero-fallback_yokvg7.jpg"),
}: HeroSectionProps) {
  const whatsappNumber = env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const content = LANDING_CONTENT.hero;

  const showVideo = isProd && videoSrc && !videoSrc.includes('placehold.co');

  const whatsappHref = getWhatsAppUrl(
    whatsappNumber,
    "Hola, me interesa cotizar concreto y aprovechar el cálculo de volumetría gratis."
  );

  return (
    <section className={styles.hero} aria-label="Introducción">
      {/* Background Layer */}
      <div className={styles.hero__background} aria-hidden="true">
        <div className={styles.hero__overlay} />
        {showVideo ? (
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
        ) : fallbackImage ? (
          <img
            src={fallbackImage}
            className={styles.hero__imageFallback}
            alt=""
            aria-hidden="true"
          />
        ) : (
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
            <span className={styles.hero__highlight}>
              {content.title.highlight}
            </span>
          </h1>

          <p className={styles.hero__lead}>
            Suministro confiable de <strong>concreto y servicio de bombeo</strong> para contratistas y particulares. Evita desperdicios con nuestro cálculo de volumetría exacto.
          </p>

          <ul className={styles.hero__features}>
            {content.features.map((feature, idx) => (
              <li key={idx} className={styles.hero__feature}>
                <CheckIcon />
                <span>
                  {feature.text}{" "}
                  {feature.highlight && <strong>{feature.highlight}</strong>}
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

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--c-accent)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
