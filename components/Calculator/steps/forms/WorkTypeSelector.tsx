'use client';

import { useCejStore } from '@/store/useCejStore';
import { WORK_TYPES } from '@/config/business';
import { Select } from '@/components/ui/Select/Select';
import { type ChangeEvent } from 'react';
import { type WorkTypeId } from '@/components/Calculator/types';
import styles from '../../CalculatorForm.module.scss';

export function WorkTypeSelector() {
    const workType = useCejStore((s) => s.draft.workType);
    const setWorkType = useCejStore((s) => s.setWorkType);

    const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value as WorkTypeId | '';
        setWorkType(val || null);
    };

    return (
        <>
            <label htmlFor="work-type-select" className={styles.label}>
                Tipo de Obra
            </label>
            <Select
                id="work-type-select"
                value={workType || ''}
                onChange={handleChange}
                variant="dark"
            >
                <option value="" disabled>Selecciona una opción...</option>
                {WORK_TYPES.map((w) => (
                    <option key={w.id} value={w.id}>
                        {w.label}
                    </option>
                ))}
            </Select>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Seleccionar el tipo ajusta automáticamente la resistencia recomendada.
            </p>
        </>
    );
}
