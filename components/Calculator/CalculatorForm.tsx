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
import styles from './CalculatorForm.module.scss';

export function CalculatorForm() {
    // 1. Store State (Select necessary fields)
    const draft = useCejStore((s) => s.draft);

    // 2. Actions
    const { setMode } = useCejStore(
        useShallow((s) => ({
            setMode: s.setMode,
        }))
    );

    // 3. Calculation Logic (Hooks)
    const { quote, isValid, error, warning } = useQuoteCalculator(draft);

    // 4. Focus Management Refs
    const inputsSectionRef = useRef<HTMLDivElement>(null);
    const specsSectionRef = useRef<HTMLDivElement>(null);

    // Effect: Shift focus to inputs section when Mode changes
    useEffect(() => {
        if (draft.mode && inputsSectionRef.current) {
            // Find the first interactive element in the section
            const firstInput = inputsSectionRef.current.querySelector('input, select');
            if (firstInput instanceof HTMLElement) {
                firstInput.focus();
            }
        }
    }, [draft.mode]);

    // Effect: Shift focus to specs when inputs are valid (soft guidance)
    // Note: We avoid aggressive auto-focus here to not disturb typing,
    // but ensuring the section is ready.

    return (
        <div className={styles.container}>
            {/* --- SECTION 1: MODE --- */}
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

            {/* --- SECTION 2: DYNAMIC INPUTS --- */}
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
                                {/* Pass specific volume error down to assist form */}
                                <AssistVolumeForm error={error} />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* --- SECTION 3: SPECS (Visible only if valid or assisting) --- */}
            {(draft.mode === 'knownM3' || draft.workType) && (
                <div className={styles.fieldWithSeparator} ref={specsSectionRef}>
                    <SpecsForm />
                </div>
            )}

            {/* --- SECTION 4: FEEDBACK --- */}
            {error && (
                <div className={styles.error} role="alert">
                    {error}
                </div>
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

            {/* --- SECTION 5: SUMMARY --- */}
            <CalculatorSummary
                quote={quote}
                isValid={isValid && !error}
            />
        </div>
    );
}
