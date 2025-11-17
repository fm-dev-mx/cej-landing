// components/Calculator/steps/Step1Mode.tsx

import type { CalculatorMode } from '../types';
import styles from '../Calculator.module.scss';

type Props = {
  mode: CalculatorMode | null;
  onModeChange: (mode: CalculatorMode) => void;
};

export function Step1Mode({ mode, onModeChange }: Props) {
  return (
    <div className={`${styles.step} ${styles.stepAnimated}`}>
      <header className={styles.stepHeader}>
        <span className={styles.stepBadge}>1</span>
        <h2 className={styles.stepTitle}>¿Cómo quieres cotizar?</h2>
      </header>

      <div className={styles.stepBody}>
        <div className={styles.radioGroup}>
          <label className={styles.radio}>
            <input
              type="radio"
              name="calc-mode"
              value="knownM3"
              checked={mode === 'knownM3'}
              onChange={() => onModeChange('knownM3')}
            />
            <span>Ya sé cuántos m³ necesito</span>
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              name="calc-mode"
              value="assistM3"
              checked={mode === 'assistM3'}
              onChange={() => onModeChange('assistM3')}
            />
            <span>Ayúdame a calcular los m³</span>
          </label>
        </div>
      </div>
    </div>
  );
}
