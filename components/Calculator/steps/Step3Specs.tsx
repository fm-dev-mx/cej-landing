// components/Calculator/steps/Step3Specs.tsx

import { useCallback, type ChangeEvent } from "react";
import {
  CONCRETE_TYPES,
  STRENGTHS,
  type CalculatorMode,
  type Strength,
  type ConcreteType,
} from "../types";
import styles from "../Calculator.module.scss";

type Props = {
  strength: Strength;
  type: ConcreteType;
  mode: CalculatorMode | null;
  onStrengthChange: (strength: Strength) => void;
  onTypeChange: (type: ConcreteType) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function Step3Specs(props: Props) {
  const {
    strength,
    type,
    mode,
    onStrengthChange,
    onTypeChange,
    onBack,
    onContinue,
  } = props;

  const handleStrengthChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onStrengthChange(e.target.value as Strength);
    },
    [onStrengthChange]
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
                  onChange={() => onTypeChange(t.value)}
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
            onClick={onBack}
          >
            Atrás
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onContinue}
          >
            Ver Cotización Final
          </button>
        </div>
      </div>
    </div>
  );
}
