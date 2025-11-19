// components/Calculator/steps/Step3Specs.tsx
'use client';

import { useCallback, type ChangeEvent } from "react";
import { useCalculatorContext } from "../context/CalculatorContext";
import { type Strength } from "../types";
import { STRENGTHS, CONCRETE_TYPES } from "@/config/business";
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
          <select
            id="fck"
            value={strength}
            onChange={handleStrengthChange}
            className={`${styles.control} ${styles.select}`}
          >
            {STRENGTHS.map((s) => (
              <option key={s} value={s}>
                {s} kg/cm²
              </option>
            ))}
          </select>
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
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => setStep(2)}
          >
            Atrás
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => setStep(4)}
          >
            Ver Cotización Final
          </button>
        </div>
      </div>
    </div>
  );
}
