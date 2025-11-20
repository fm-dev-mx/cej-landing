// components/Services/Services.tsx
import { LANDING_CONTENT } from "@/config/content";
import styles from "./Services.module.scss";

export default function Services() {
  const { title, titleHighlight, subtitle, items } = LANDING_CONTENT.services;

  return (
    <section id="services" className={`${styles.section} section`}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {title} <br />
            <span>{titleHighlight}</span>
          </h2>
          <p className={styles.subtitle}>
            {subtitle}
          </p>
        </div>

        <div className={styles.grid}>
          {items.map((s) => (
            <article key={s.id} className={styles.card}>
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
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
