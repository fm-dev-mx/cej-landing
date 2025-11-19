// components/Calculator/steps/Step1Mode.tsx

import { WORK_TYPES, type CalculatorMode, type WorkTypeId } from '../types';
import styles from '../Calculator.module.scss';

type Props = {
  mode: CalculatorMode | null;
  workType: WorkTypeId;
  onModeChange: (mode: CalculatorMode) => void;
  onWorkTypeSelect: (id: WorkTypeId) => void;
};

export function Step1Mode({
  mode,
  workType,
  onModeChange,
  onWorkTypeSelect,
}: Props) {
  return (
    <div className={`${styles.step} ${styles.stepAnimated}`}>
      <header className={styles.stepHeader}>
        <h2 className={styles.stepTitle}>
          ¿Ya conoces la resistencia y los metros cúbicos que necesitas?
        </h2>
      </header>

      <div className={styles.stepBody}>
        {/* Main Decision: Yes/No */}
        <div className={styles.radioGroup}>
          <label className={styles.radio}>
            <input
              type="radio"
              name="calc-mode"
              value="knownM3"
              checked={mode === 'knownM3'}
              // Clicking "Si" immediately sets mode and should trigger navigation in parent
              onClick={() => onModeChange('knownM3')}
              onChange={() => onModeChange('knownM3')}
            />
            <span>Si</span>
          </label>

          <label className={styles.radio}>
            <input
              type="radio"
              name="calc-mode"
              value="assistM3"
              checked={mode === 'assistM3'}
              // Clicking "No" sets mode but keeps us here to choose Work Type
              onClick={() => onModeChange('assistM3')}
              onChange={() => onModeChange('assistM3')}
            />
            <span>No, ayúdame a definirlo</span>
          </label>
        </div>

        {/* Expanded Selection: Work Types (Only visible if "No" is selected) */}
        {mode === 'assistM3' && (
          <div className={styles.stepAnimated} style={{ marginTop: '2rem' }}>
            <p className={styles.field} style={{ marginBottom: '1rem', color: 'var(--c-muted-on-dark)' }}>
              Selecciona el tipo de obra para continuar:
            </p>

            <div className={styles.radioGroup}>
              {WORK_TYPES.map((w) => (
                <label
                  key={w.id}
                  className={styles.radio}
                  // Use onClick to trigger selection + navigation
                  onClick={() => onWorkTypeSelect(w.id)}
                >
                  <input
                    type="radio"
                    name="work-type"
                    value={w.id}
                    checked={workType === w.id}
                    readOnly // Controlled by the onClick parent handler
                  />
                  <span>
                    <strong>{w.label}</strong>
                    <small style={{ display: 'block', marginTop: '0.2rem' }}>
                      {w.description}
                    </small>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
