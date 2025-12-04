// components/Calculator/steps/Step2WorkType.tsx
'use client';

import { useCalculatorContext } from '../context/CalculatorContext';
import { Button } from '@/components/ui/Button/Button';
import { WorkTypeSelector } from './forms/WorkTypeSelector';
import styles from '../Calculator.module.scss';

export function Step2WorkType() {
  const { setStep } = useCalculatorContext();

  return (
    <div className={`${styles.step} ${styles.stepAnimated}`}>
      <header className={styles.stepHeader}>
        <h2 className={styles.stepTitle}>¿Qué vas a construir?</h2>
        <p className={styles.stepSubtitle}>
          Selecciona el tipo de obra para sugerirte la resistencia ideal.
        </p>
      </header>

      <div className={styles.stepBody}>
        <WorkTypeSelector />

        <div className={styles.stepControls}>
          <Button variant="tertiary" onClick={() => setStep(1)}>
            Atrás
          </Button>
          {/* Note: Forward navigation happens automatically when selecting a card */}
        </div>
      </div>
    </div>
  );
}
