// components/Calculator/steps/Step1Mode.tsx
'use client';

import { useCallback } from 'react';
import { useCalculatorContext } from '../context/CalculatorContext';
import { type CalculatorMode, type WorkTypeId } from '../types';
import { WORK_TYPES } from '@/config/business';
import styles from '../Calculator.module.scss';

export function Step1Mode() {
  const {
    mode,
    workType,
    setMode,
    setWorkType,
    setStep
  } = useCalculatorContext();

  // Encapsulated navigation logic
  const handleModeChange = useCallback((newMode: CalculatorMode) => {
    setMode(newMode);
    // If user knows M3, skip directly to inputs (Step 2)
    if (newMode === 'knownM3') {
      setStep(2);
    }
  }, [setMode, setStep]);

  const handleWorkTypeSelect = useCallback((id: WorkTypeId) => {
    setWorkType(id);
    // Proceed to Step 2 upon work type selection
    setStep(2);
  }, [setWorkType, setStep]);

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
              onChange={() => handleModeChange('knownM3')}
            />
            <span>Si</span>
          </label>

          <label className={styles.radio}>
            <input
              type="radio"
              name="calc-mode"
              value="assistM3"
              checked={mode === 'assistM3'}
              onChange={() => handleModeChange('assistM3')}
            />
            <span>No, ayúdame a definirlo</span>
          </label>
        </div>

        {/* Expanded Selection: Work Types */}
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
                  onClick={() => handleWorkTypeSelect(w.id)}
                >
                  <input
                    type="radio"
                    name="work-type"
                    value={w.id}
                    checked={workType === w.id}
                    readOnly
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
