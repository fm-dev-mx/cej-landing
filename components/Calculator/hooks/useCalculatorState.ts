// components/Calculator/hooks/useCalculatorState.ts

import { useCallback } from 'react';
import { useCejStore } from '@/store/useCejStore';
import {
    type AssistVolumeMode,
    type CalculatorMode,
    type CalculatorState,
    type CofferedSize,
    type ConcreteType,
    type Step,
    type Strength,
    type WorkTypeId,
} from '../types';
import { WORK_TYPES } from '@/config/business';

export function useCalculatorState() {
    // Read directly from Global Store Staging Area
    const state = useCejStore((s) => s.currentDraft);
    const update = useCejStore((s) => s.updateDraft);
    const reset = useCejStore((s) => s.resetDraft);

    const setStep = useCallback((step: Step) => {
        update({ step });
    }, [update]);

    const setMode = useCallback((mode: CalculatorMode | null) => {
        if (mode === null) {
            update({ mode: null });
            return;
        }

        const nextUpdates: Partial<CalculatorState> = { mode };
        if (mode === 'knownM3') {
            nextUpdates.length = '';
            nextUpdates.width = '';
            nextUpdates.area = '';
            // Reset assist-mode specific fields
            nextUpdates.workType = null;
            nextUpdates.hasCoffered = 'no';
            nextUpdates.cofferedSize = null;
            nextUpdates.step = 3;
        } else {
            nextUpdates.m3 = '';
            nextUpdates.step = 2;
        }
        update(nextUpdates);
    }, [update]);

    const setVolumeMode = useCallback((volumeMode: AssistVolumeMode) => update({ volumeMode }), [update]);
    const setStrength = useCallback((strength: Strength) => update({ strength }), [update]);
    const setType = useCallback((type: ConcreteType) => update({ type }), [update]);
    const setM3 = useCallback((m3: string) => update({ m3 }), [update]);

    const setWorkType = useCallback((workType: WorkTypeId | null) => {
        if (workType === null) {
            update({ workType: null, strength: '200' });
            return;
        }

        const cfg = WORK_TYPES.find((w) => w.id === workType);
        update({
            workType,
            strength: cfg ? cfg.recommendedStrength : state.strength,
            hasCoffered: workType === 'slab' ? 'yes' : 'no',
            cofferedSize: workType === 'slab' ? '7' : null,
            step: 3
        });
    }, [update, state.strength]);

    const setLength = useCallback((length: string) => update({ length }), [update]);
    const setWidth = useCallback((width: string) => update({ width }), [update]);
    const setThicknessByDims = useCallback((thicknessByDims: string) => update({ thicknessByDims }), [update]);
    const setArea = useCallback((area: string) => update({ area }), [update]);
    const setThicknessByArea = useCallback((thicknessByArea: string) => update({ thicknessByArea }), [update]);

    const setHasCoffered = useCallback((hasCoffered: 'yes' | 'no') => update({
        hasCoffered,
        cofferedSize: hasCoffered === 'yes' ? '7' : null,
    }), [update]);

    const setCofferedSize = useCallback((cofferedSize: CofferedSize) => update({ cofferedSize }), [update]);

    return {
        ...state,
        resetCalculator: reset,
        setStep,
        setMode,
        setVolumeMode,
        setStrength,
        setType,
        setM3,
        setWorkType,
        setLength,
        setWidth,
        setThicknessByDims,
        setArea,
        setThicknessByArea,
        setHasCoffered,
        setCofferedSize,
    };
}
