"use client";

import { useState } from "react";
import styles from "./FAQ.module.scss";

type FAQItem = {
  question: string;
  answer: string;
};

const FAQS: FAQItem[] = [
  {
    question: "¿Cuál es el pedido mínimo de concreto?",
    answer:
      "Para tiro directo el mínimo es de 2 m³, y para servicio con bomba es de 3 m³. Si requieres menos cantidad, contáctanos para evaluar la disponibilidad y el cargo por 'falso flete' correspondiente.",
  },
  {
    question: "¿Con cuánto tiempo de anticipación debo hacer mi pedido?",
    answer:
      "Recomendamos realizar tu pedido con 24 a 48 horas de anticipación para asegurar el horario de colado que prefieras. Para fines de semana, sugerimos reservar con 3 días de antelación.",
  },
  {
    question: "¿Qué formas de pago aceptan?",
    answer:
      "Aceptamos transferencias bancarias (SPEI), depósitos en efectivo y pago con tarjeta (crédito/débito) directo en nuestras oficinas o mediante enlace de pago seguro.",
  },
  {
    question: "¿Hacen visitas técnicas?",
    answer:
      "Sí. Una vez que tienes una cotización estimada y fecha tentativa, nuestros técnicos pueden visitar la obra sin costo extra para confirmar accesos, volumetría final y tipo de bomba requerida.",
  },
];

export default function FAQ() {
  // Start with the first item open; use null to collapse all items
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex((previousIndex) =>
      previousIndex === index ? null : index,
    );
  };

  return (
    <section id="faq" className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>Preguntas Frecuentes</h2>
          <p className={styles.subtitle}>
            Resolvemos tus dudas sobre tiempos de entrega, pagos y logística.
          </p>
        </header>

        <div className={styles.accordion}>
          {FAQS.map((item, index) => {
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
