// components/Calculator/steps/Step1Mode.tsx
'use client';

import { useCallback } from 'react';
import { useCalculatorContext } from '../context/CalculatorContext';
import { type CalculatorMode, type WorkTypeId } from '../types';
import { WORK_TYPES } from '@/config/business';
import { SelectionCard } from '@/components/ui/SelectionCard/SelectionCard';
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
        {/* Mode Selection using new Cards */}
        <div className={styles.selectionGrid}>
          <SelectionCard
            id="mode-known"
            name="calc-mode"
            value="knownM3"
            label="Sí"
            description="Ingresa directamente los m³ y la resistencia."
            isSelected={mode === 'knownM3'}
            onChange={() => handleModeChange('knownM3')}
            // Add click handler for better touch response if onChange lags
            onClick={() => handleModeChange('knownM3')}
          />

          <SelectionCard
            id="mode-assist"
            name="calc-mode"
            value="assistM3"
            label="No, ayúdame a calcular"
            description="Calcula el volumen basado en medidas o tipo de obra."
            icon="🛟"
            isSelected={mode === 'assistM3'}
            onChange={() => handleModeChange('assistM3')}
          />
        </div>

        {/* Work Type Selection (Only visible in Assist Mode) */}
        {mode === 'assistM3' && (
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>
              Selecciona qué vas a construir:
            </h3>

            <div className={styles.selectionGrid}>
              {WORK_TYPES.map((w) => (
                <SelectionCard
                  key={w.id}
                  id={`work-${w.id}`}
                  name="work-type"
                  value={w.id}
                  label={w.label}
                  description={w.description}
                  icon={w.icon} // Uses the new icon from business config
                  isSelected={workType === w.id}
                  onChange={() => handleWorkTypeSelect(w.id)}
                  onClick={() => handleWorkTypeSelect(w.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
