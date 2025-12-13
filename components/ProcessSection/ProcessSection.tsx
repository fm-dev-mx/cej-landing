import { LANDING_CONTENT } from "@/config/content";
import { Card } from "@/components/ui/Card/Card";
import Image from "next/image";
import styles from "./ProcessSection.module.scss";

export default function ProcessSection() {
  const { title, subtitle, steps } = LANDING_CONTENT.process;

  return (
    <section className={styles.section} aria-labelledby="process-heading">
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 id="process-heading" className={styles.title}>
            {title}
          </h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </header>

        <ol className={styles.stepsGrid}>
          {steps.map((step, index) => (
            <li key={step.id} className={styles.stepWrapper}>
              <Card.Root variant="surface" className={styles.stepCard}>
                <div className={styles.imageWrapper}>
                  <Image
                    src={step.imageSrc}
                    alt={step.imageAlt}
                    fill
                    className={styles.stepImage}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  <div className={styles.stepBadge}>{index + 1}</div>
                </div>

                <Card.Body className={styles.cardBody}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </Card.Body>
              </Card.Root>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
