// components/SocialProofSection/SocialProofSection.tsx
import Image from "next/image";
import { LANDING_CONTENT } from "@/config/content";
import { Card } from "@/components/ui/Card/Card";
import styles from "./SocialProofSection.module.scss";

export default function SocialProofSection() {
  const { title, subtitle, works, stats, testimonials } = LANDING_CONTENT.socialProof;

  return (
    <section
      id="projects"
      className={styles.section}
      aria-labelledby="social-proof-title"
    >
      <div className={styles.container}>
        {/* 1. Header & Stats */}
        <header className={styles.header}>
          <h2 id="social-proof-title" className={styles.title}>
            {title}
          </h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </header>

        {stats && stats.length > 0 && (
          <div className={styles.statsBar}>
            {stats.map((stat) => (
              <div key={stat.id} className={styles.statItem}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* 2. Visual Proof (Works) */}
        <div className={styles.worksGrid}>
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

        {/* 3. Social Validation (Testimonials) */}
        {testimonials && testimonials.length > 0 && (
          <div className={styles.testimonialsSection}>
            <div className={styles.testimonialsHeader}>
              <span>Lo que dicen quienes construyen con nosotros</span>
            </div>

            <div className={styles.testimonialsGrid}>
              {testimonials.map((t) => (
                <Card.Root key={t.id} variant="outline" className="bg-white/50">
                  <Card.Body>
                    <div className={styles.quoteIcon} aria-hidden="true">“</div>
                    <blockquote className={styles.quoteText}>
                      &quot;{t.quote}&quot;
                    </blockquote>
                    <div className={styles.authorBlock}>
                      <div
                        className={styles.authorInitial}
                        data-type={t.type}
                        aria-hidden="true"
                      >
                        {t.author.charAt(0)}
                      </div>
                      <div className={styles.authorInfo}>
                        <span className={styles.authorName}>{t.author}</span>
                        <span className={styles.authorRole}>{t.role}</span>
                      </div>
                    </div>
                  </Card.Body>
                </Card.Root>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
