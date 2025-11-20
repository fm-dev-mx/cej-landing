// components/Calculator/steps/Step2Inputs.tsx
'use client';

import { useCallback, type ChangeEvent } from 'react';
import { useCalculatorContext } from '../context/CalculatorContext';
import type { QuoteWarning } from '../hooks/useCalculatorQuote';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import styles from '../Calculator.module.scss';

// Helper component to render warnings
function VolumeWarningMessage({ warning }: { warning: QuoteWarning }) {
  if (!warning) return null;

  switch (warning.code) {
    case 'BELOW_MINIMUM':
      return (
        <>
          Para concreto <strong>{warning.typeLabel}</strong>, el volumen mínimo es de{' '}
          <strong>{warning.minM3.toFixed(1)} m³</strong>. La cotización se calcula
          sobre <strong>{warning.billedM3.toFixed(1)} m³</strong>.
        </>
      );
    case 'ROUNDING_POLICY':
      return (
        <>
          Por política, el concreto se cotiza en múltiplos de{' '}
          <strong>0.5 m³</strong>. Ingresaste {warning.requestedM3.toFixed(2)} m³
          y se está cotizando sobre <strong>{warning.billedM3.toFixed(2)} m³</strong>.
        </>
      );
    case 'ROUNDING_ADJUSTMENT':
      return (
        <>
          El volumen se ajusta a múltiplos de <strong>0.5 m³</strong>. Se está
          cotizando sobre {warning.billedM3.toFixed(2)} m³.
        </>
      );
    default:
      return null;
  }
}

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
          <Input
            id="vol-known"
            label="Volumen (m³)"
            type="number"
            min={0}
            step={0.5}
            value={m3}
            onChange={handleNumericInput(setM3)}
            isVolume={true}
            inputMode="decimal"
            placeholder="0.0"
          />
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
                <Input
                  id="length"
                  label="Largo (m)"
                  type="number"
                  min={0}
                  step={0.5}
                  value={length}
                  onChange={handleNumericInput(setLength)}
                  inputMode="decimal"
                  placeholder="0.00"
                />
                <Input
                  id="width"
                  label="Ancho (m)"
                  type="number"
                  min={0}
                  step={0.5}
                  value={width}
                  onChange={handleNumericInput(setWidth)}
                  inputMode="decimal"
                  placeholder="0.00"
                />
                <Input
                  id="thickness-dims"
                  label="Grosor (cm)"
                  type="number"
                  min={0}
                  step={1}
                  value={thicknessByDims}
                  onChange={handleNumericInput(setThicknessByDims)}
                  inputMode="decimal"
                  placeholder="10"
                />
              </>
            )}

            {volumeMode === 'area' && (
              <>
                <Input
                  id="area"
                  label="Área total (m²)"
                  type="number"
                  min={0}
                  step={0.1}
                  value={area}
                  onChange={handleNumericInput(setArea)}
                  inputMode="decimal"
                  placeholder="0.00"
                />
                <Input
                  id="thickness-area"
                  label="Grosor (cm)"
                  type="number"
                  min={0}
                  step={1}
                  value={thicknessByArea}
                  onChange={handleNumericInput(setThicknessByArea)}
                  inputMode="decimal"
                  placeholder="10"
                />
              </>
            )}

            {/* Coffered Slab block */}
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

                { /* Coffered Slab Dimensions */}
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

        {/* Volume Error and Warning */}
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
          <div className={styles.error}>
            <VolumeWarningMessage warning={volumeWarning} />
          </div>
        )}

        <div className={styles.stepControls}>
          <Button
            variant="secondary"
            onClick={() => setStep(1)}
          >
            Atrás
          </Button>
          <Button
            variant="primary"
            onClick={() => setStep(3)}
            disabled={!canProceedToSpecs}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
