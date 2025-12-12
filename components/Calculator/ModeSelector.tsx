'use client';

import { useCejStore } from '@/store/useCejStore';
import { SelectionCard } from '@/components/ui/SelectionCard/SelectionCard';
import { type CalculatorMode } from '@/types/domain';
import styles from './CalculatorForm.module.scss';

interface Props {
    currentMode: CalculatorMode;
}

export function ModeSelector({ currentMode }: Props) {
    const setMode = useCejStore((s) => s.setMode);

    return (
        <div className={styles.selectionGrid}>
            <SelectionCard
                id="mode-known"
                name="mode"
                value="knownM3"
                label="Sé la cantidad"
                description="Tengo los m³ exactos."
                isSelected={currentMode === 'knownM3'}
                onChange={() => setMode('knownM3')}
            />
            <SelectionCard
                id="mode-assist"
                name="mode"
                value="assistM3"
                label="Ayúdame a calcular"
                description="En base a medidas."
                customIndicator="📐"
                isSelected={currentMode === 'assistM3'}
                onChange={() => setMode('assistM3')}
            />
        </div>
    );
}
