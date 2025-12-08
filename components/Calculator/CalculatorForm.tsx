'use client';

import { useEffect, useRef } from 'react';
import { useCejStore } from '@/store/useCejStore';
import { useShallow } from 'zustand/react/shallow';
import { useQuoteCalculator } from '@/hooks/useQuoteCalculator';
import { CalculatorSummary } from './CalculatorSummary';
import { ModeSelector } from './steps/ModeSelector';
import { KnownVolumeForm } from './steps/forms/KnownVolumeForm';
import { WorkTypeSelector } from './steps/forms/WorkTypeSelector';
import { AssistVolumeForm } from './steps/forms/AssistVolumeForm';
import { SpecsForm } from './steps/forms/SpecsForm';
import { AdditivesForm } from './steps/forms/AdditivesForm';
import styles from './CalculatorForm.module.scss';

/**
 * CalculatorForm Orchestrator
 * Connects the Store state to the presentation components.
 * Refactored to reduce complexity.
 */
export function CalculatorForm() {
    const draft = useCejStore((s) => s.draft);

    // Engine Logic
    const { quote, isValid, error, warning } = useQuoteCalculator(draft);

    // Focus Management
    const inputsSectionRef = useRef<HTMLDivElement>(null);
    const specsSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (draft.mode && inputsSectionRef.current) {
            const firstInput = inputsSectionRef.current.querySelector('input, select');
            if (firstInput instanceof HTMLElement) firstInput.focus();
        }
    }, [draft.mode]);

    return (
        <div className={styles.container}>
            {/* 1. Mode Selection */}
            <div className={styles.field}>
                <label className={styles.label}>¿Cómo quieres cotizar?</label>
                <ModeSelector currentMode={draft.mode} />
            </div>

            {/* 2. Volume Inputs */}
            <div ref={inputsSectionRef}>
                {draft.mode === 'knownM3' ? (
                    <div className={styles.field}>
                        <KnownVolumeForm hasError={!!error} />
                    </div>
                ) : (
                    <>
                        <div className={styles.field}>
                            <WorkTypeSelector />
                        </div>
                        {draft.workType && (
                            <div className={styles.field}>
                                <AssistVolumeForm error={error} />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* 3. Specs & Additives */}
            {(draft.mode === 'knownM3' || draft.workType) && (
                <div className={styles.fieldWithSeparator} ref={specsSectionRef}>
                    <SpecsForm />

                    {/* Expert Mode Section */}
                    {draft.showExpertOptions && (
                        <div className={styles.animateFadeIn}>
                            <AdditivesForm />
                        </div>
                    )}
                </div>
            )}

            {/* 4. Feedback & Warning */}
            {error && (
                <div className={styles.error} role="alert">{error}</div>
            )}

            {!error && warning && (
                <div className={styles.note}>
                    {warning.code === 'BELOW_MINIMUM' && (
                        <span>Nota: El pedido mínimo es {warning.minM3} m³. Se ajustará el precio.</span>
                    )}
                    {warning.code === 'ROUNDING_POLICY' && (
                        <span>El volumen se ajusta a múltiplos de 0.5 m³.</span>
                    )}
                </div>
            )}

            {/* 5. Summary */}
            <CalculatorSummary quote={quote} isValid={isValid && !error} />
        </div>
    );
}
