// components/Calculator/steps/Step1Mode.tsx
'use client';

import { useCalculatorContext } from '../context/CalculatorContext';
import { SelectionCard } from '@/components/ui/SelectionCard/SelectionCard';
import styles from '../Calculator.module.scss';

export function Step1Mode() {
  const { mode, setMode } = useCalculatorContext();

  return (
    <div className={`${styles.step} ${styles.stepAnimated}`}>
      <header className={styles.stepHeader}>
        <h2 className={styles.stepTitle}>
          ¿Ya conoces los metros cúbicos que necesitas?
        </h2>
      </header>

      <div className={styles.stepBody}>
        <div className={styles.selectionGrid}>
          <SelectionCard
            id="mode-known"
            name="calc-mode"
            value="knownM3"
            label="Sí"
            description="Ingresa directamente los m³ y la resistencia."
            isSelected={mode === 'knownM3'}
            onChange={() => setMode('knownM3')}
            onClick={() => setMode('knownM3')}
          />

          <SelectionCard
            id="mode-assist"
            name="calc-mode"
            value="assistM3"
            label="No, ayúdame a calcular"
            description="Calcula el volumen basado en medidas o tipo de obra."
            icon="🛟"
            isSelected={mode === 'assistM3'}
            onChange={() => setMode('assistM3')}
            onClick={() => setMode('assistM3')}
          />
        </div>
      </div>
    </div>
  );
}
