'use client';

import { useState, useEffect } from 'react';
import { useCejStore } from '@/store/useCejStore';
import { useQuoteCalculator } from '@/hooks/useQuoteCalculator';
import { WorkTypeSelector } from './Forms/WorkTypeSelector';
import { AssistVolumeForm } from './Forms/AssistVolumeForm';
import { Button } from '@/components/ui/Button/Button';
import styles from './VolumeAssistant.module.scss';
import formStyles from './CalculatorForm.module.scss';

interface Props {
    onComplete: () => void;
}

export function VolumeAssistant({ onComplete }: Props) {
    const draft = useCejStore((s) => s.draft);
    const { workType } = draft;
    const { billedM3, error } = useQuoteCalculator(draft);

    // Internal step to focus the user
    // 1: Work Type, 2: Dimensions
    const [internalStep, setInternalStep] = useState(1);

    useEffect(() => {
        if (workType && internalStep === 1) {
            setInternalStep(2);
        }
    }, [workType, internalStep]);

    const canProceed = billedM3 > 0 && !error;

    return (
        <div className={styles.wrapper}>
            <div className={`${formStyles.field} ${internalStep === 1 ? formStyles.activeField : ''}`}>
                <WorkTypeSelector />
            </div>

            {workType && (
                <div className={`${formStyles.field} ${formStyles.gamifiedReveal} ${internalStep === 2 ? formStyles.activeField : ''}`}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>Calcula el volumen</h3>
                        <p className={styles.sectionSubtitle}>Ingresa las medidas de tu área.</p>
                    </div>

                    <AssistVolumeForm />

                    {billedM3 > 0 && (
                        <div className={styles.resultBox}>
                            <span className={styles.resultLabel}>Volumen calculado:</span>
                            <span className={styles.resultValue}>{billedM3.toFixed(2)} m³</span>
                        </div>
                    )}

                    <div className={styles.actions}>
                        <Button
                            variant="primary"
                            fullWidth
                            disabled={!canProceed}
                            onClick={onComplete}
                        >
                            Continuar a Precios y Especificaciones →
                        </Button>
                        <button
                            type="button"
                            className={styles.backBtn}
                            onClick={() => {
                                useCejStore.getState().setWorkType(null);
                                setInternalStep(1);
                            }}
                        >
                            ← Cambiar tipo de obra
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
