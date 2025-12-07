// components/Calculator/Calculator.tsx
'use client';

import { CalculatorForm } from './CalculatorForm';
import styles from './Calculator.module.scss';

export default function Calculator() {
  return (
    <section
      id="calculator-section"
      className={styles.wrapper}
      aria-labelledby="calculator-heading"
    >
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <h2 id="calculator-heading" className={styles.headerTitle}>
              Cotiza tu <span className={styles.headerTitleAccent}>concreto</span>{' '}
              al instante
            </h2>
            <p className={styles.headerSubtitle}>
              Calcula, agrega varios ítems y genera tu pedido en segundos.
            </p>
          </div>
        </header>

        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <CalculatorForm />
        </form>
      </div>
    </section>
  );
}
