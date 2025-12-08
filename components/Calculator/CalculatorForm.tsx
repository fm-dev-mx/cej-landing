'use client';

import { useEffect, useRef } from 'react';
import { useCejStore } from '@/store/useCejStore';
import { useShallow } from 'zustand/react/shallow';
import { useQuoteCalculator } from '@/hooks/useQuoteCalculator';
import { SelectionCard } from '@/components/ui/SelectionCard/SelectionCard';
import { CalculatorSummary } from './CalculatorSummary';
import { KnownVolumeForm } from './steps/forms/KnownVolumeForm';
import { WorkTypeSelector } from './steps/forms/WorkTypeSelector';
import { AssistVolumeForm } from './steps/forms/AssistVolumeForm';
import { SpecsForm } from './steps/forms/SpecsForm';
import { AdditivesForm } from './steps/forms/AdditivesForm';
import styles from './CalculatorForm.module.scss';

export function CalculatorForm() {
    // State
    const draft = useCejStore((s) => s.draft);

    // Actions
    const { setMode } = useCejStore(
        useShallow((s) => ({ setMode: s.setMode }))
    );

    // Calc Engine
    const { quote, isValid, error, warning } = useQuoteCalculator(draft);

    // Refs
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
                <div className={styles.selectionGrid}>
                    <SelectionCard
                        id="mode-known"
                        name="mode"
                        value="knownM3"
                        label="Sé la cantidad"
                        description="Tengo los m³ exactos."
                        isSelected={draft.mode === 'knownM3'}
                        onChange={() => setMode('knownM3')}
                    />
                    <SelectionCard
                        id="mode-assist"
                        name="mode"
                        value="assistM3"
                        label="Ayúdame a calcular"
                        description="En base a medidas."
                        customIndicator="📐"
                        isSelected={draft.mode === 'assistM3'}
                        onChange={() => setMode('assistM3')}
                    />
                </div>
            </div>

            {/* 2. Inputs */}
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
