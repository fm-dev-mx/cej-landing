// components/Calculator/steps/Step2Inputs.tsx
'use client';

import { useCallback, type ChangeEvent } from 'react';
import { useCalculatorContext } from '../context/CalculatorContext';
import styles from '../Calculator.module.scss';

export function Step2Inputs() {
  const {
    // State
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

    // Calculated results and validations
    billedM3,
    requestedM3,
    volumeError,
    volumeWarning,

    // Setters
    setM3,
    setLength,
    setWidth,
    setThicknessByDims,
    setArea,
    setThicknessByArea,
    setVolumeMode,
    setHasCoffered,
    setCofferedSize,
    setStep
  } = useCalculatorContext();

  // Local logic to validate if we can proceed
  const canProceedToSpecs = !volumeError && billedM3 > 0;

  const handleNumericInput = useCallback(
    (next: (value: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
      // Normalize commas to dots and remove non-numeric characters
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
              onChange={handleNumericInput(setM3)}
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
                    onChange={() => setVolumeMode('dimensions')}
                  />
                  <span>Largo × Ancho</span>
                </label>
                <label className={styles.radio}>
                  <input
                    type="radio"
                    name="volume-mode"
                    value="area"
                    checked={volumeMode === 'area'}
                    onChange={() => setVolumeMode('area')}
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
                    onChange={handleNumericInput(setLength)}
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
                    onChange={handleNumericInput(setWidth)}
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
                    onChange={handleNumericInput(setThicknessByDims)}
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
                    onChange={handleNumericInput(setArea)}
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
                    onChange={handleNumericInput(setThicknessByArea)}
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
                  <div className={styles.radioRowCompact}>
                    <label className={styles.radio}>
                      <input
                        type="radio"
                        name="coffered"
                        value="no"
                        checked={hasCoffered === 'no'}
                        onChange={() => setHasCoffered('no')}
                      />
                      <span>No (Sólida)</span>
                    </label>
                    <label className={styles.radio}>
                      <input
                        type="radio"
                        name="coffered"
                        value="yes"
                        checked={hasCoffered === 'yes'}
                        onChange={() => setHasCoffered('yes')}
                      />
                      <span>Sí (Aligerada)</span>
                    </label>
                  </div>
                </div>

                {/* SUB-BLOQUE: Tamaño de casetón (Estilo Pills) */}
                {hasCoffered === 'yes' && (
                  <div
                    className={`${styles.field} ${styles.stepAnimated}`}
                    style={{ marginTop: '1rem' }}
                  >
                    <label style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                      Selecciona la altura del casetón:
                    </label>

                    <div className={styles.pillGroup}>
                      <label className={styles.pill}>
                        <input
                          type="radio"
                          name="coffered-size"
                          value="10"
                          checked={cofferedSize === '10'}
                          onChange={() => setCofferedSize('10')}
                        />
                        <span>10 cm</span>
                      </label>

                      <label className={styles.pill}>
                        <input
                          type="radio"
                          name="coffered-size"
                          value="7"
                          checked={cofferedSize === '7'}
                          onChange={() => setCofferedSize('7')}
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
            onClick={() => setStep(1)}
          >
            Atrás
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => setStep(3)}
            disabled={!canProceedToSpecs}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
