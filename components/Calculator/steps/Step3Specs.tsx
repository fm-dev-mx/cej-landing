// components/Calculator/steps/Step3Specs.tsx
'use client';

import { useCallback, type ChangeEvent } from "react";
import { useCalculatorContext } from "../context/CalculatorContext";
import { type Strength } from "../types";
import { STRENGTHS, CONCRETE_TYPES } from "@/config/business";
import { Button } from "@/components/ui/Button/Button";
import { Select } from "@/components/ui/Select/Select";
import { SelectionCard } from "@/components/ui/SelectionCard/SelectionCard";
import styles from "../Calculator.module.scss";

export function Step3Specs() {
  const {
    strength,
    type,
    mode,
    setStrength,
    setType,
    setStep,
    isCalculating,
    simulateCalculation
  } = useCalculatorContext();

  const handleStrengthChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setStrength(e.target.value as Strength);
    },
    [setStrength]
  );

  const handleCalculate = () => {
    simulateCalculation(() => {
        setStep(4);
    });
  };

  return (
    <div className={`${styles.step} ${styles.stepAnimated}`}>
      <div className={styles.stepBody}>

        <div className={styles.field}>
          <label htmlFor="fck">Resistencia (f’c)</label>
          <Select
            id="fck"
            value={strength}
            onChange={handleStrengthChange}
          >
            {STRENGTHS.map((s) => (
              <option key={s} value={s}>
                {s} kg/cm²
              </option>
            ))}
          </Select>
          {mode === "assistM3" && (
            <p className={styles.hint}>
              Sugerida según el tipo de obra que seleccionaste previamente.
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label>Tipo de servicio</label>
          <div className={styles.selectionGrid}>
            {CONCRETE_TYPES.map((t) => (
              <SelectionCard
                key={t.value}
                id={`type-${t.value}`}
                name="service-type"
                value={t.value}
                label={t.label}
                isSelected={type === t.value}
                onChange={() => setType(t.value)}
              />
            ))}
          </div>
        </div>

        <div className={styles.stepControls}>
          <Button
            variant="secondary"
            onClick={() => setStep(2)}
            disabled={isCalculating}
          >
            Atrás
          </Button>
          <Button
            variant="primary"
            onClick={handleCalculate}
            isLoading={isCalculating}
            disabled={isCalculating}
          >
            Ver Cotización Final
          </Button>
        </div>
      </div>
    </div>
  );
}
