// components/TrustSection/TrustSection.tsx
import { LANDING_CONTENT } from "@/config/content";
import styles from "./TrustSection.module.scss";

export default function TrustSection() {
  const { title, items } = LANDING_CONTENT.trust;

  return (
    <section
      className={styles.section}
      aria-labelledby="trust-heading"
    >
      <div className={styles.container}>
        <h2 id="trust-heading" className={styles.sectionTitle}>
          {title}
        </h2>

        <div className={styles.grid}>
          {items.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.headerRow}>
                <div className={styles.iconBox} aria-hidden="true">
                  {item.icon}
                </div>
                <h3 className={styles.title}>{item.title}</h3>
              </div>
              <p className={styles.desc}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
