// components/Calculator/steps/Step2Inputs.tsx

import { useCallback, type ChangeEvent, type ReactNode } from 'react';
import { type AssistVolumeMode, type CalculatorMode, type WorkTypeId, type CofferedSize } from '../types';
import styles from '../Calculator.module.scss';

type Props = {
  mode: CalculatorMode;
  volumeMode: AssistVolumeMode;
  m3: string;
  workType: WorkTypeId;
  length: string;
  width: string;
  thicknessByDims: string;
  area: string;
  thicknessByArea: string;
  hasCoffered: 'yes' | 'no';
  cofferedSize: CofferedSize | null; // Nueva prop
  requestedM3: number;
  billedM3: number;
  volumeError: string | null;
  volumeWarning: ReactNode | null;
  canProceedToSpecs: boolean;
  onBackToStep1: () => void;
  onContinueToStep3: () => void;
  onM3Change: (value: string) => void;
  onLengthChange: (value: string) => void;
  onWidthChange: (value: string) => void;
  onThicknessByDimsChange: (value: string) => void;
  onAreaChange: (value: string) => void;
  onThicknessByAreaChange: (value: string) => void;
  onVolumeModeChange: (mode: AssistVolumeMode) => void;
  onHasCofferedChange: (value: 'yes' | 'no') => void;
  onCofferedSizeChange: (value: CofferedSize) => void; // Nuevo handler
};

export function Step2Inputs(props: Props) {
  const {
    mode,
    volumeMode,
    m3,
    workType,
    length,
    width,
    thicknessByDims,
    area,
    thicknessByArea,
    hasCoffered,
    cofferedSize,
    requestedM3,
    billedM3,
    volumeError,
    volumeWarning,
    canProceedToSpecs,
    onBackToStep1,
    onContinueToStep3,
    onM3Change,
    onLengthChange,
    onWidthChange,
    onThicknessByDimsChange,
    onAreaChange,
    onThicknessByAreaChange,
    onVolumeModeChange,
    onHasCofferedChange,
    onCofferedSizeChange,
  } = props;

  const handleNumericInput = useCallback(
    (next: (value: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/,/g, '.');
      const cleaned = raw.replace(/[^0-9.]/g, '');
      next(cleaned);
    },
    []
  );

  return (
    <div className={`${styles.step} ${styles.stepAnimated}`}>
      <div className={styles.stepBody}>
        {/* Flow A: Known Volume */}
        {mode === 'knownM3' && (
          <div className={styles.field}>
            <label htmlFor="vol-known">Volumen (m³)</label>
            <input
              id="vol-known"
              type="number"
              min={0}
              step={0.5}
              value={m3}
              onChange={handleNumericInput(onM3Change)}
              className={`${styles.control} ${styles.volumeInput}`}
              inputMode="decimal"
              placeholder="0.0"
            />
          </div>
        )}

        {/* Flow B: Assist Volume */}
        {mode === 'assistM3' && (
          <>
            <div className={styles.field}>
              <label>Método de cálculo</label>
              <div className={styles.radioRow}>
                <label className={styles.radio}>
                  <input
                    type="radio"
                    name="volume-mode"
                    value="dimensions"
                    checked={volumeMode === 'dimensions'}
                    onChange={() => onVolumeModeChange('dimensions')}
                  />
                  <span>Largo × Ancho</span>
                </label>
                <label className={styles.radio}>
                  <input
                    type="radio"
                    name="volume-mode"
                    value="area"
                    checked={volumeMode === 'area'}
                    onChange={() => onVolumeModeChange('area')}
                  />
                  <span>Por Área (m²)</span>
                </label>
              </div>
            </div>

            {volumeMode === 'dimensions' && (
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
                    placeholder="0.00"
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
                    placeholder="0.00"
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
                    placeholder="10"
                  />
                </div>
              </>
            )}

            {volumeMode === 'area' && (
              <>
                <div className={styles.field}>
                  <label htmlFor="area">Área total (m²)</label>
                  <input
                    id="area"
                    type="number"
                    min={0}
                    step={0.1}
                    value={area}
                    onChange={handleNumericInput(onAreaChange)}
                    className={styles.control}
                    inputMode="decimal"
                    placeholder="0.00"
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
                    placeholder="10"
                  />
                </div>
              </>
            )}

            {/* Bloque Casetón solo para Losas */}
            {workType === 'slab' && (
              <>
                <div className={`${styles.field} ${styles.stepAnimated}`}>
                  <label>¿La losa lleva casetón?</label>
                  {/* CAMBIO 1: Usamos radioRowCompact para ponerlos lado a lado */}
                  <div className={styles.radioRowCompact}>
                    <label className={styles.radio}>
                      <input
                        type="radio"
                        name="coffered"
                        value="no"
                        checked={hasCoffered === 'no'}
                        onChange={() => onHasCofferedChange('no')}
                      />
                      <span>No (Sólida)</span>
                    </label>
                    <label className={styles.radio}>
                      <input
                        type="radio"
                        name="coffered"
                        value="yes"
                        checked={hasCoffered === 'yes'}
                        onChange={() => onHasCofferedChange('yes')}
                      />
                      <span>Sí (Aligerada)</span>
                    </label>
                  </div>
                </div>

                {/* SUB-BLOQUE: Tamaño de casetón (Estilo Pills) */}
                {hasCoffered === 'yes' && (
                  <div
                    className={`${styles.field} ${styles.stepAnimated}`}
                    style={{ marginTop: '1rem' }} // Separación sutil
                  >
                    <label style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                      Selecciona la altura del casetón:
                    </label>

                    {/* CAMBIO 2: Usamos el estilo Pill Group */}
                    <div className={styles.pillGroup}>
                      <label className={styles.pill}>
                        <input
                          type="radio"
                          name="coffered-size"
                          value="10"
                          checked={cofferedSize === '10'}
                          onChange={() => onCofferedSizeChange('10')}
                        />
                        <span>10 cm</span>
                      </label>

                      <label className={styles.pill}>
                        <input
                          type="radio"
                          name="coffered-size"
                          value="7"
                          checked={cofferedSize === '7'}
                          onChange={() => onCofferedSizeChange('7')}
                        />
                        <span>7 cm</span>
                      </label>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Feedback & Nav */}
        {volumeError && (
          <p className={styles.error} role="alert">
            {volumeError}
          </p>
        )}

        {!volumeError && billedM3 > 0 && (
          <div className={styles.note}>
            <p>
              Volumen calculado: <strong>{billedM3.toFixed(2)} m³</strong>
            </p>
            {requestedM3 > 0 && requestedM3 !== billedM3 && (
              <p className={styles.hint} style={{ marginTop: '0.25rem' }}>
                (Exacto: {requestedM3.toFixed(2)} m³)
              </p>
            )}
          </div>
        )}

        {!volumeError && volumeWarning && (
          <div className={styles.error}>{volumeWarning}</div>
        )}

        <div className={styles.stepControls}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={onBackToStep1}
          >
            Atrás
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onContinueToStep3}
            disabled={!canProceedToSpecs}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
