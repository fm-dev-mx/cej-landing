// components/Calculator/Calculator.tsx
'use client';

import { CalculatorProvider, useCalculatorContext } from './context/CalculatorContext';
import { Step1Mode } from './steps/Step1Mode';
import { Step2WorkType } from './steps/Step2WorkType';
import { Step3Inputs } from './steps/Step3Inputs';
import { Step4Specs } from './steps/Step4Specs';
import { Step5Summary } from './steps/Step5Summary';
import { ESTIMATE_LEGEND } from '@/config/business';
import styles from './Calculator.module.scss';

function CalculatorContent() {
  const { step, mode } = useCalculatorContext();

  // Total steps logic:
  // If knownM3 -> Steps: 1 (Mode), 3 (Inputs), 4 (Specs), 5 (Summary) [Visual progress logic is simplified here]
  // If assistM3 -> Steps: 1, 2, 3, 4, 5.
  // For simplicity in progress bar, we assume 5 max steps.
  const totalSteps = 5;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
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

            // Skip rendering "Step 2" dot if we are in "Known Mode" to avoid confusion?
            // Actually, keeping 5 dots is consistent. If we skip step 2, dot 2 effectively becomes "skipped".
            // A simpler approach for MVP is just highlighting up to current step.

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
            La volumetría final se confirma en obra.
          </p>
        </div>
      </header>

      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        {step === 1 && <Step1Mode />}
        {step === 2 && mode === 'assistM3' && <Step2WorkType />}
        {step === 3 && mode !== null && <Step3Inputs />}
        {step === 4 && mode !== null && <Step4Specs />}
        {step === 5 && mode !== null && <Step5Summary estimateLegend={ESTIMATE_LEGEND} />}
      </form>
    </div>
  );
}

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
