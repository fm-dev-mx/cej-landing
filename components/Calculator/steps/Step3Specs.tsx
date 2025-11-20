// components/Calculator/steps/Step3Specs.tsx
'use client';

import { useCallback, type ChangeEvent } from "react";
import { useCalculatorContext } from "../context/CalculatorContext";
import { type Strength } from "../types";
import { STRENGTHS, CONCRETE_TYPES } from "@/config/business";
import { Button } from "@/components/ui/Button/Button";
import { Select } from "@/components/ui/Select/Select";
import styles from "../Calculator.module.scss";

export function Step3Specs() {
  const {
    strength,
    type,
    mode,
    setStrength,
    setType,
    setStep
  } = useCalculatorContext();

  const handleStrengthChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setStrength(e.target.value as Strength);
    },
    [setStrength]
  );

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
          <div className={styles.radioGroup}>
            {CONCRETE_TYPES.map((t) => (
              <label key={t.value} className={styles.radio}>
                <input
                  type="radio"
                  name="tipo"
                  value={t.value}
                  checked={type === t.value}
                  onChange={() => setType(t.value)}
                />
                <span>{t.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.stepControls}>
          <Button
            variant="secondary"
            onClick={() => setStep(2)}
          >
            Atrás
          </Button>
          <Button
            variant="primary"
            onClick={() => setStep(4)}
          >
            Ver Cotización Final
          </Button>
        </div>
      </div>
    </div>
  );
}
