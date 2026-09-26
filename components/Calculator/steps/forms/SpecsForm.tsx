// components/Calculator/steps/forms/SpecsForm.tsx
'use client';

import { useCallback, type ChangeEvent } from 'react';
import { useCalculatorContext } from '../../context/CalculatorContext';
import { type ConcreteOption } from '../../types';
import { CONCRETE_OPTIONS, CONCRETE_TYPES, FIBER_PRICE_PER_M3, isConcreteOptionAvailable } from '@/config/business';
import { Select } from '@/components/ui/Select/Select';
import { SelectionCard } from '@/components/ui/SelectionCard/SelectionCard';
import styles from '../../CalculatorSteps.module.scss';

export function SpecsForm() {
    const { strength, type, hasFiber, mode, setStrength, setType, setHasFiber } = useCalculatorContext();

    const handleStrengthChange = useCallback(
        (e: ChangeEvent<HTMLSelectElement>) => {
            const nextOption = e.target.value as ConcreteOption;
            setStrength(nextOption);

            if (type === 'pumped' && !isConcreteOptionAvailable(nextOption, 'pumped')) {
                setType('direct');
            }
        },
        [setStrength, type, setType]
    );

    return (
        <>
            <div className={styles.field}>
                <label htmlFor="concrete-option">Producto y especificación</label>
                <Select id="concrete-option" value={strength} onChange={handleStrengthChange}>
                    {CONCRETE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
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
                        const isDisabled = !isConcreteOptionAvailable(strength, t.value);
                        return (
                            <SelectionCard
                                key={t.value}
                                id={`type-${t.value}`}
                                name="service-type"
                                value={t.value}
                                label={t.label}
                                isSelected={type === t.value}
                                onChange={() => {
                                    setType(t.value);
                                }}
                                disabled={isDisabled}
                                className={isDisabled ? styles.disabled : ''}
                            />
                        );
                    })}
                </div>
            </div>

            <div className={styles.field}>
                <label htmlFor="has-fiber">Adicional</label>
                <label className={styles.radio} htmlFor="has-fiber">
                    <input
                        id="has-fiber"
                        type="checkbox"
                        checked={hasFiber}
                        onChange={(event) => setHasFiber(event.target.checked)}
                    />
                    <span className={styles.fiberCopy}>
                        Agregar Fibra
                        <small className={styles.fiberPrice}>${FIBER_PRICE_PER_M3.toLocaleString('es-MX')}/m³ (IVA incluido)</small>
                    </span>
                </label>
            </div>
        </>
    );
}
