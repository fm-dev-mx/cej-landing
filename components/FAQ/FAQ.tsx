// components/FAQ/FAQ.tsx
"use client";

import { useState } from "react";
import { LANDING_CONTENT } from "@/config/content";
import styles from "./FAQ.module.scss";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { title, subtitle, items } = LANDING_CONTENT.faq;

  const toggleItem = (index: number) => {
    setOpenIndex((previousIndex) =>
      previousIndex === index ? null : index,
    );
  };

  return (
    <section id="faq" className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>
            {subtitle}
          </p>
        </header>

        <div className={styles.accordion}>
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            const id = `faq-item-${index}`;
            const contentId = `faq-content-${index}`;

            return (
              <div
                key={index}
                className={styles.item}
                data-open={isOpen}
              >
                <button
                  type="button"
                  className={styles.trigger}
                  onClick={() => toggleItem(index)}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  id={id}
                >
                  {item.question}
                  <ChevronIcon className={styles.icon} />
                </button>

                <div
                  className={styles.contentWrapper}
                  role="region"
                  aria-labelledby={id}
                  id={contentId}
                >
                  <div className={styles.contentInner}>
                    <p className={styles.answer}>{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
