// components/layout/HeroSection.tsx

import styles from "./HeroSection.module.scss";

type HeroSectionProps = {
  videoSrc?: string; // Ruta al video en /public, ej: "/videos/hero-bg.mp4"
  fallbackImage?: string; // Imagen si el video no carga o en modo ahorro de datos
};

export default function HeroSection({
  videoSrc = "https://res.cloudinary.com/dwtk0d2dj/video/upload/v1763502599/hero-bg_vluny8.mp4", // Asegúrate de subir este archivo a public/
  fallbackImage = "https://res.cloudinary.com/dwtk0d2dj/image/upload/v1763502640/hero-fallback_yokvg7.jpg",
}: HeroSectionProps) {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

  // Mensaje predefinido para mejorar la conversión
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
            <span>Calidad y Tiempo en Ciudad Juárez</span>
          </div>

          <h1 className={styles.hero__title}>
            Tu obra no se detiene, <br />
            <span className={styles.hero__highlight}>nosotros tampoco.</span>
          </h1>

          <p className={styles.hero__lead}>
            Suministro de concreto premezclado con <strong>acompañamiento experto</strong> desde el inicio. Evita desperdicios y retrasos.
          </p>

          {/* Trust Signals / Differentiators */}
          <ul className={styles.hero__features}>
            <li className={styles.hero__feature}>
              <CheckIcon /> <span>Cálculo de volumetría <strong>GRATIS</strong></span>
            </li>
            <li className={styles.hero__feature}>
              <CheckIcon /> <span>Entregas puntuales garantizadas</span>
            </li>
            <li className={styles.hero__feature}>
              <CheckIcon /> <span>Asesoría técnica incluida</span>
            </li>
          </ul>

          <div className={styles.hero__actions}>
            <a href="#calculator" className={styles.hero__btnPrimary}>
              Cotizar ahora
            </a>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.hero__btnSecondary}
              >
                <span className={styles.hero__iconWa}>💬</span>
                Hablar con un experto
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
