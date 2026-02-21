// components/Calculator/steps/forms/SpecsForm.tsx
'use client';

import { useCallback, type ChangeEvent } from 'react';
import { useCalculatorContext } from '../../context/CalculatorContext';
import { type Strength } from '../../types';
import { STRENGTHS, CONCRETE_TYPES } from '@/config/business';
import { Select } from '@/components/ui/Select/Select';
import { SelectionCard } from '@/components/ui/SelectionCard/SelectionCard';
import styles from '../../CalculatorSteps.module.scss';

export function SpecsForm() {
    const { strength, type, mode, setStrength, setType } = useCalculatorContext();

    const handleStrengthChange = useCallback(
        (e: ChangeEvent<HTMLSelectElement>) => {
            const nextStrength = e.target.value as Strength;
            setStrength(nextStrength);

            // AUTO-ADJUST: If 100 is selected and current type is pumped, switch to direct
            if (nextStrength === '100' && type === 'pumped') {
                setType('direct');
            }
        },
        [setStrength, type, setType]
    );

    return (
        <>
            <div className={styles.field}>
                <label htmlFor="fck">Resistencia (f’c)</label>
                <Select id="fck" value={strength} onChange={handleStrengthChange}>
                    {STRENGTHS.map((s) => (
                        <option key={s} value={s}>
                            {s} kg/cm²
                        </option>
                    ))}
                </Select>
                {mode === 'assistM3' && (
                    <p className={styles.hint}>
                        Sugerida según el tipo de obra que seleccionaste previamente.
                    </p>
                )}
            </div>

            <div className={styles.field}>
                <label>Tipo de servicio</label>
                <div className={styles.selectionGrid}>
                    {CONCRETE_TYPES.map((t) => {
                        const isDisabled = t.value === 'pumped' && strength === '100';
                        return (
                            <SelectionCard
                                key={t.value}
                                id={`type-${t.value}`}
                                name="service-type"
                                value={t.value}
                                label={t.label}
                                isSelected={type === t.value}
                                onChange={() => setType(t.value)}
                                disabled={isDisabled}
                                className={isDisabled ? styles.disabled : ''}
                            />
                        );
                    })}
                </div>
            </div>
        </>
    );
}
