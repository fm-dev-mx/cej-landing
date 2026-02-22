// components/TrustSection/TrustSection.tsx
import { LANDING_CONTENT } from "@/config/content";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card/Card";
import styles from "./TrustSection.module.scss";

export default function TrustSection() {
  const { title, items } = LANDING_CONTENT.trust;

  return (
    <section className={styles.section} aria-labelledby="trust-heading">
      <div className={styles.container}>
        <h2 id="trust-heading" className={styles.sectionTitle}>
          {title}
        </h2>

        <div className={styles.grid}>
          {items.map((item) => (
            <Card.Root key={item.id} variant="glass">
              <Card.Header>
                <div className={styles.iconBox}>
                  <Icon name={item.icon} size={28} />
                </div>
                <h3 className={styles.title}>{item.title}</h3>
              </Card.Header>
              <Card.Body>
                <p className={styles.desc}>{item.desc}</p>
              </Card.Body>
            </Card.Root>
          ))}
        </div>
      </div>
    </section>
  );
}
