// components/Calculator/steps/Step2Inputs.tsx

import { useCallback, type ChangeEvent } from "react";
import {
  CONCRETE_TYPES,
  STRENGTHS,
  WORK_TYPES,
  type AssistVolumeMode,
  type CalculatorMode,
  type Strength,
  type ConcreteType,
  type WorkTypeId,
} from "../types";
import styles from "../Calculator.module.scss";

type Props = {
  mode: CalculatorMode;
  volumeMode: AssistVolumeMode;
  strength: Strength;
  type: ConcreteType;
  m3: string;
  workType: WorkTypeId;
  length: string;
  width: string;
  thicknessByDims: string;
  area: string;
  thicknessByArea: string;
  hasCoffered: "yes" | "no";
  requestedM3: number;
  billedM3: number;
  volumeError: string | null;
  volumeWarning: string | null;
  canProceedToSummary: boolean;
  onBackToStep1: () => void;
  onContinueToStep3: () => void;
  onM3Change: (value: string) => void;
  onLengthChange: (value: string) => void;
  onWidthChange: (value: string) => void;
  onThicknessByDimsChange: (value: string) => void;
  onAreaChange: (value: string) => void;
  onThicknessByAreaChange: (value: string) => void;
  onVolumeModeChange: (mode: AssistVolumeMode) => void;
  onWorkTypeChange: (id: WorkTypeId) => void;
  onStrengthChange: (strength: Strength) => void;
  onTypeChange: (type: ConcreteType) => void;
  onHasCofferedChange: (value: "yes" | "no") => void;
};

export function Step2Inputs(props: Props) {
  const {
    mode,
    volumeMode,
    strength,
    type,
    m3,
    workType,
    length,
    width,
    thicknessByDims,
    area,
    thicknessByArea,
    hasCoffered,
    requestedM3,
    billedM3,
    volumeError,
    volumeWarning,
    canProceedToSummary,
    onBackToStep1,
    onContinueToStep3,
    onM3Change,
    onLengthChange,
    onWidthChange,
    onThicknessByDimsChange,
    onAreaChange,
    onThicknessByAreaChange,
    onVolumeModeChange,
    onWorkTypeChange,
    onStrengthChange,
    onTypeChange,
    onHasCofferedChange,
  } = props;

  const handleNumericInput = useCallback(
    (next: (value: string) => void) =>
      (e: ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/,/g, ".");
        const cleaned = raw.replace(/[^0-9.]/g, "");
        next(cleaned);
      },
    []
  );

  const handleStrengthChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onStrengthChange(e.target.value as Strength);
    },
    [onStrengthChange]
  );

  return (
    <div className={`${styles.step} ${styles.stepAnimated}`}>
      <header className={styles.stepHeader}>
        <span className={styles.stepBadge}>2</span>
        <h2 className={styles.stepTitle}>
          {mode === "knownM3"
            ? "Ingresa tu volumen y detalles del concreto"
            : "Cuéntanos de tu obra para estimar los m³"}
        </h2>
      </header>

      <div className={styles.stepBody}>
        {/* Flow A: user already knows volume */}
        {mode === "knownM3" && (
          <div className={styles.field}>
            <label htmlFor="vol-known">Volumen (m³)</label>
            <input
              id="vol-known"
              type="number"
              min={0}
              step={0.1}
              value={m3}
              onChange={handleNumericInput(onM3Change)}
              className={styles.control}
              aria-describedby="vol-known-hint"
              inputMode="decimal"
            />
            <p id="vol-known-hint" className={styles.hint}>
              Puedes ingresar decimales; se cotiza redondeando hacia arriba a
              múltiplos de 0.5 m³ y respetando el mínimo por tipo de concreto.
            </p>
          </div>
        )}

        {/* Flow B: assist user with volume */}
        {mode === "assistM3" && (
          <>
            <div className={styles.field}>
              <label>Tipo de obra</label>
              <div className={styles.radioGroup}>
                {WORK_TYPES.map((w) => (
                  <label key={w.id} className={styles.radio}>
                    <input
                      type="radio"
                      name="work-type"
                      value={w.id}
                      checked={workType === w.id}
                      onChange={() => onWorkTypeChange(w.id)}
                    />
                    <span>
                      <strong>{w.label}</strong>
                      <br />
                      <small>{w.description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label>¿Cómo quieres calcular el volumen?</label>
              <div className={styles.radioGroup}>
                <label className={styles.radio}>
                  <input
                    type="radio"
                    name="volume-mode"
                    value="dimensions"
                    checked={volumeMode === "dimensions"}
                    onChange={() => onVolumeModeChange("dimensions")}
                  />
                  <span>Por largo × ancho</span>
                </label>
                <label className={styles.radio}>
                  <input
                    type="radio"
                    name="volume-mode"
                    value="area"
                    checked={volumeMode === "area"}
                    onChange={() => onVolumeModeChange("area")}
                  />
                  <span>Por m²</span>
                </label>
              </div>
            </div>

            {volumeMode === "dimensions" && (
              <>
                <div className={styles.field}>
                  <label htmlFor="length">Largo (m)</label>
                  <input
                    id="length"
                    type="number"
                    min={0}
                    step={0.1}
                    value={length}
                    onChange={handleNumericInput(onLengthChange)}
                    className={styles.control}
                    inputMode="decimal"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="width">Ancho (m)</label>
                  <input
                    id="width"
                    type="number"
                    min={0}
                    step={0.1}
                    value={width}
                    onChange={handleNumericInput(onWidthChange)}
                    className={styles.control}
                    inputMode="decimal"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="thickness-dims">Grosor (cm)</label>
                  <input
                    id="thickness-dims"
                    type="number"
                    min={0}
                    step={0.5}
                    value={thicknessByDims}
                    onChange={handleNumericInput(onThicknessByDimsChange)}
                    className={styles.control}
                    inputMode="decimal"
                  />
                </div>
              </>
            )}

            {volumeMode === "area" && (
              <>
                <div className={styles.field}>
                  <label htmlFor="area">Área (m²)</label>
                  <input
                    id="area"
                    type="number"
                    min={0}
                    step={0.1}
                    value={area}
                    onChange={handleNumericInput(onAreaChange)}
                    className={styles.control}
                    inputMode="decimal"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="thickness-area">Grosor (cm)</label>
                  <input
                    id="thickness-area"
                    type="number"
                    min={0}
                    step={0.5}
                    value={thicknessByArea}
                    onChange={handleNumericInput(onThicknessByAreaChange)}
                    className={styles.control}
                    inputMode="decimal"
                  />
                </div>
              </>
            )}

            <div className={styles.field}>
              <label>¿La losa lleva casetón?</label>
              <div className={styles.radioGroup}>
                <label className={styles.radio}>
                  <input
                    type="radio"
                    name="coffered"
                    value="no"
                    checked={hasCoffered === "no"}
                    onChange={() => onHasCofferedChange("no")}
                  />
                  <span>No</span>
                </label>
                <label className={styles.radio}>
                  <input
                    type="radio"
                    name="coffered"
                    value="yes"
                    checked={hasCoffered === "yes"}
                    onChange={() => onHasCofferedChange("yes")}
                  />
                  <span>Sí</span>
                </label>
              </div>
              <p className={styles.hint}>
                Aplicamos el factor de casetón según tu selección para estimar
                los m³.
              </p>
            </div>
          </>
        )}

        {/* Strength */}
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
              La resistencia se sugiere según el tipo de obra, pero puedes
              ajustarla si tu ingeniero estructurista indica otra.
            </p>
          )}
        </div>

        {/* Concrete type */}
        <div className={styles.field}>
          <label>Tipo de concreto</label>
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

        {/* Volume info / errors */}
        {volumeError && (
          <p className={styles.error} role="alert">
            {volumeError}
          </p>
        )}

        {!volumeError && billedM3 > 0 && (
          <p className={styles.note}>
            Volumen cotizado:{" "}
            <strong>{billedM3.toFixed(2)} m³</strong>
            {requestedM3 > 0 &&
              requestedM3 !== billedM3 &&
              ` (a partir de ${requestedM3.toFixed(2)} m³ ingresados).`}
          </p>
        )}

        {!volumeError && volumeWarning && (
          <p className={styles.note}>{volumeWarning}</p>
        )}

        {/* Step controls */}
        <div className={styles.stepControls}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={onBackToStep1}
          >
            Volver al paso 1
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onContinueToStep3}
            disabled={!canProceedToSummary}
          >
            Continuar a la cotización
          </button>
        </div>
      </div>
    </div>
  );
}
