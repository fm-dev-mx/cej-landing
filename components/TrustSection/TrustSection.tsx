// components/TrustSection/TrustSection.tsx
import { LANDING_CONTENT } from "@/config/content";
import styles from "./TrustSection.module.scss";

export default function TrustSection() {
  const { title, items } = LANDING_CONTENT.trust;

  return (
    <section className={styles.section} aria-label="Razones para confiar en nosotros">
      <div className={styles.container}>
        {/* Hidden visually heading for accessibility structure flow (H2 after H1),
           but visually we just show the grid items as a 'bar'.
        */}
        <h2 className={styles.srOnly}>{title}</h2>

        <div className={styles.grid}>
          {items.map((item) => (
            <div key={item.id} className={styles.item}>
              <div className={styles.iconBox} aria-hidden="true">
                {item.icon}
              </div>
              <div className={styles.content}>
                <h3 className={styles.title}>{item.title}</h3>
                <p className={styles.desc}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
