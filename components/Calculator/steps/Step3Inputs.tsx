// components/Calculator/steps/Step3Inputs.tsx
'use client';

import { useCalculatorContext } from '../context/CalculatorContext';
import type { QuoteWarning } from '../types';
import { Button } from '@/components/ui/Button/Button';
import { KnownVolumeForm } from './forms/KnownVolumeForm';
import { AssistVolumeForm } from './forms/AssistVolumeForm';
import styles from '../CalculatorSteps.module.scss';

function VolumeWarningMessage({ warning }: { warning: QuoteWarning }) {
  if (!warning) return null;

  switch (warning.code) {
    case 'BELOW_MINIMUM':
      return (
        <>
          Mínimo para <strong>{warning.typeLabel}</strong> es{' '}
          <strong>{warning.minM3.toFixed(1)} m³</strong>. Se cotiza sobre el mínimo.
        </>
      );
    case 'ROUNDING_POLICY':
      return (
        <>
          Se cotiza en múltiplos de <strong>0.5 m³</strong>.
        </>
      );
    case 'ROUNDING_ADJUSTMENT':
      return (
        <>
          Ajustado a múltiplos de <strong>0.5 m³</strong>.
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
    volumeError,
    volumeWarning,
    setStep
  } = useCalculatorContext();

  const canProceed = !volumeError && billedM3 > 0;

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
          {mode === 'knownM3' ? 'Volumen requerido' : 'Ingresa medidas'}
        </h2>
        {mode === 'assistM3' && (
          <p className={styles.stepSubtitle}>
            Introduce los datos de tu área a colar.
          </p>
        )}
      </header>

      <div className={styles.stepBody}>
        {mode === 'knownM3' ? <KnownVolumeForm /> : <AssistVolumeForm />}

        {/* Feedback Section - Sticky via CSS logic */}

        {volumeError && (
          <div className={styles.error} role="alert">
            {volumeError}
          </div>
        )}

        {!volumeError && billedM3 > 0 && (
          <div className={styles.note}>
            {volumeWarning && (
              <div className={styles.warningFeedback}>
                <VolumeWarningMessage warning={volumeWarning} />
              </div>
            )}
          </div>
        )}

        <div className={styles.stepControls}>
          <Button variant="tertiary" onClick={handleBack}>
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
