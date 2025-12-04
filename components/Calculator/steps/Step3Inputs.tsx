// components/Calculator/steps/Step3Inputs.tsx
'use client';

import { useCalculatorContext } from '../context/CalculatorContext';
import type { QuoteWarning } from '../hooks/useCalculatorQuote';
import { Button } from '@/components/ui/Button/Button';
import { KnownVolumeForm } from './forms/KnownVolumeForm';
import { AssistVolumeForm } from './forms/AssistVolumeForm';
import styles from '../Calculator.module.scss';

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

export function Step3Inputs() {
  const {
    mode,
    billedM3,
    requestedM3,
    volumeError,
    volumeWarning,
    setStep
  } = useCalculatorContext();

  // Local logic to validate if we can proceed
  const canProceed = !volumeError && billedM3 > 0;

  // Navigation Logic
  // If mode is known, we came from Step 1.
  // If mode is assist, we came from Step 2.
  const handleBack = () => {
    if (mode === 'knownM3') {
      setStep(1);
    } else {
      setStep(2);
    }
  };

  return (
    <div className={`${styles.step} ${styles.stepAnimated}`}>
      <header className={styles.stepHeader}>
        <h2 className={styles.stepTitle}>
          {mode === 'knownM3' ? 'Ingresa el volumen' : 'Calcula el volumen'}
        </h2>
      </header>

      <div className={styles.stepBody}>
        {mode === 'knownM3' ? <KnownVolumeForm /> : <AssistVolumeForm />}

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
          <Button variant="secondary" onClick={handleBack}>
            Atrás
          </Button>
          <Button
            variant="primary"
            onClick={() => setStep(4)}
            disabled={!canProceed}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
