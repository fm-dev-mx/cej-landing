// components/Calculator/steps/forms/WorkTypeSelector.tsx
'use client';

import { useCallback } from 'react';
import { useCalculatorContext } from '../../context/CalculatorContext';
import { WORK_TYPES } from '@/config/business';
import { SelectionCard } from '@/components/ui/SelectionCard/SelectionCard';
import { type WorkTypeId } from '../../types';
import styles from '../../CalculatorSteps.module.scss';

export function WorkTypeSelector() {
    const { workType, setWorkType } = useCalculatorContext();

    const handleWorkTypeSelect = useCallback((id: WorkTypeId) => {
        // Calling setWorkType updates the state and automatically advances 'step' to 3.
        setWorkType(id);
    }, [setWorkType]);

    return (
        <div className={styles.selectionGrid}>
            {WORK_TYPES.map((w) => (
                <SelectionCard
                    key={w.id}
                    id={`work-${w.id}`}
                    name="work-type"
                    value={w.id}
                    label={w.label}
                    description={w.description}
                    icon={w.icon}
                    isSelected={workType === w.id}
                    onChange={() => handleWorkTypeSelect(w.id)}
                    onClick={() => handleWorkTypeSelect(w.id)}
                />
            ))}
        </div>
    );
}
