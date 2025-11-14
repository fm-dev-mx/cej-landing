// components/layout/HeroSection.tsx

import styles from "./HeroSection.module.scss";

type HeroSectionProps = {
  title?: string;
  lead?: string;
  children?: React.ReactNode;
};

export default function HeroSection({
  title = "Premium ready-mix concrete in Ciudad Juárez",
  lead = "Fast quotes, transparent pricing, and on-time delivery for residential and commercial projects.",
  children,
}: HeroSectionProps) {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        "Quote request — CEJ concrete calculator"
      )}`
    : undefined;

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.hero__container}>
        <div className={styles.hero__content}>
          <h1 id="hero-title" className={styles.hero__title}>
            {title}
          </h1>
          <p className={styles.hero__lead}>{lead}</p>

          <div className={styles.hero__actions}>
            <a className={styles.hero__btn} href="#calculator">
              Open calculator
            </a>
            {whatsappHref && (
              <a
                className={styles["hero__btn--outline"]}
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp quote
              </a>
            )}
          </div>
        </div>

        {children ? <div className={styles.hero__slot}>{children}</div> : null}
      </div>
    </section>
  );
}
