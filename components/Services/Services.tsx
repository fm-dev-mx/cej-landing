// components/Services/Services.tsx
import { LANDING_CONTENT } from "@/config/content";
import { Card } from "@/components/ui/Card/Card";
import styles from "./Services.module.scss";

export default function Services() {
  const { title, titleHighlight, subtitle, items } = LANDING_CONTENT.services;

  return (
    <section id="services" className={styles.section} aria-label="Nuestros Servicios">
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>
            {title} <br />
            <span>{titleHighlight}</span>
          </h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </header>

        <div className={styles.grid}>
          {items.map((s) => (
            <Card.Root key={s.id} variant="glass" className={styles.cardHover}>
              <Card.Body>
                <div className={styles.iconWrapper}>
                  <span
                    className={styles.icon}
                    role="img"
                    aria-label={s.ariaLabel}
                  >
                    {s.icon}
                  </span>
                </div>
                <h3 className={styles.cardTitle}>{s.title}</h3>
                <p className={styles.cardDesc}>{s.desc}</p>
              </Card.Body>
            </Card.Root>
          ))}
        </div>
      </div>
    </section>
  );
}
