// components/Calculator/Calculator.tsx
'use client';

import { CalculatorProvider, useCalculatorContext } from './context/CalculatorContext';
import { Step1Mode } from './steps/Step1Mode';
import { Step2Inputs } from './steps/Step2Inputs';
import { Step3Specs } from './steps/Step3Specs';
import { Step4Summary } from './steps/Step4Summary';
import { ESTIMATE_LEGEND } from '@/config/business';
import styles from './Calculator.module.scss';

// Internal component consuming the context
function CalculatorContent() {
  const { step, mode } = useCalculatorContext();
  const totalSteps = 4;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        {/* Progress Bar */}
        <div
          className={styles.progressContainer}
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={`Paso ${step} de ${totalSteps}`}
        >
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const stepNum = idx + 1;
            const isActive = stepNum <= step;
            return (
              <div
                key={stepNum}
                className={`${styles.progressSegment} ${isActive ? styles.active : ''}`}
              />
            );
          })}
        </div>

        <div className={styles.headerText}>
          <h2 id="calculator-heading" className={styles.headerTitle}>
            Calcula tu <span className={styles.headerTitleAccent}>concreto</span>{' '}
            al instante.
          </h2>

          <p className={styles.headerSubtitle}>
            Obtén un presupuesto estimado en segundos.
            <br />
            La volumetría final se confirma en obra por nuestros técnicos.
          </p>
        </div>
      </header>

      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        {step === 1 && <Step1Mode />}
        {step === 2 && mode !== null && <Step2Inputs />}
        {step === 3 && mode !== null && <Step3Specs />}
        {step === 4 && mode !== null && <Step4Summary estimateLegend={ESTIMATE_LEGEND} />}
      </form>
    </div>
  );
}

// Main exported component
export default function Calculator() {
  return (
    <section
      id="calculator-section"
      className={styles.wrapper}
      aria-labelledby="calculator-heading"
    >
      <CalculatorProvider>
        <CalculatorContent />
      </CalculatorProvider>
    </section>
  );
}
