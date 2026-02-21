// components/ProcessSection/ProcessSection.tsx
import { LANDING_CONTENT } from "@/config/content";
import { Card } from "@/components/ui/Card/Card";
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
              {/* Connector Line Logic handled via CSS on stepWrapper */}
              <div className={styles.connector} aria-hidden="true" />

              <Card.Root variant="surface" className={styles.stepCard}>
                <Card.Body className={styles.cardBody}>
                  <div className={styles.iconWrapper}>
                    <span className={styles.icon} aria-hidden="true">
                      {step.icon}
                    </span>
                    <span className={styles.stepNumber}>{index + 1}</span>
                  </div>

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
