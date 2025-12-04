// components/SocialProofSection/SocialProofSection.tsx
import Image from "next/image";
import { LANDING_CONTENT } from "@/config/content";
import { Card } from "@/components/ui/Card/Card";
import styles from "./SocialProofSection.module.scss";

export default function SocialProofSection() {
  const { title, subtitle, works } = LANDING_CONTENT.socialProof;

  return (
    <section
      id="projects"
      className={styles.section}
      aria-labelledby="social-proof-title"
    >
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 id="social-proof-title" className={styles.title}>
            {title}
          </h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </header>

        <div className={styles.grid}>
          {works.map((work) => (
            <Card.Root key={work.id} variant="surface">
              <Card.Header noPadding>
                <div className={styles.imageWrapper}>
                  <Image
                    src={work.imageUrl}
                    alt={work.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={styles.image}
                    loading="lazy"
                  />
                  <div className={styles.badge}>{work.category}</div>
                </div>
              </Card.Header>

              <Card.Body>
                <h3 className={styles.workTitle}>{work.title}</h3>
                <p className={styles.location}>
                  <span aria-hidden="true">📍</span> {work.location}
                </p>
              </Card.Body>
            </Card.Root>
          ))}
        </div>
      </div>
    </section>
  );
}
