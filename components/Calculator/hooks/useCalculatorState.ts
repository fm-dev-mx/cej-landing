// components/Calculator/hooks/useCalculatorState.ts

import { useCallback, useEffect, useState } from 'react';
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
import {
    STORAGE_KEY,
    WORK_TYPES
} from '@/config/business';

export const DEFAULT_CALCULATOR_STATE: CalculatorState = {
    step: 1,
    mode: null,
    volumeMode: 'dimensions',
    strength: '200',
    type: 'direct',
    m3: '',
    workType: null,
    length: '',
    width: '',
    thicknessByDims: '12',
    area: '',
    thicknessByArea: '12',
    hasCoffered: 'no',
    cofferedSize: null,
};

export function useCalculatorState() {
    const [state, setState] = useState<CalculatorState>(
        DEFAULT_CALCULATOR_STATE,
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const saved = JSON.parse(raw);
            setState((prev) => ({
                ...prev,
                ...saved,
            }));
        } catch {
            // Ignore parsing/storage errors
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const setStep = useCallback((step: Step) => {
        setState((prev) => ({ ...prev, step }));
    }, []);

    const setMode = useCallback((mode: CalculatorMode) => {
        setState((prev) => {
            const next: CalculatorState = {
                ...prev,
                mode,
            };
            if (mode === 'knownM3') {
                // If known volume, reset calc inputs and SKIP Step 2 (Work Type)
                next.length = '';
                next.width = '';
                next.area = '';
                next.step = 3;
            } else {
                // If needs assistance, go to Step 2 (Work Type)
                next.m3 = '';
                next.step = 2;
            }
            return next;
        });
    }, []);

    const setVolumeMode = useCallback((volumeMode: AssistVolumeMode) => {
        setState((prev) => ({ ...prev, volumeMode }));
    }, []);

    const setStrength = useCallback((strength: Strength) => {
        setState((prev) => ({ ...prev, strength }));
    }, []);

    const setType = useCallback((type: ConcreteType) => {
        setState((prev) => ({ ...prev, type }));
    }, []);

    const setM3 = useCallback((m3: string) => {
        setState((prev) => ({ ...prev, m3 }));
    }, []);

    const setWorkType = useCallback((workType: WorkTypeId) => {
        setState((prev) => {
            const cfg = WORK_TYPES.find((w) => w.id === workType);
            return {
                ...prev,
                workType,
                strength: cfg ? cfg.recommendedStrength : prev.strength,
                hasCoffered: 'no',
                cofferedSize: null,
                // Automatically advance to inputs when type is selected
                step: 3
            };
        });
    }, []);

    const setLength = useCallback((length: string) => {
        setState((prev) => ({ ...prev, length }));
    }, []);

    const setWidth = useCallback((width: string) => {
        setState((prev) => ({ ...prev, width }));
    }, []);

    const setThicknessByDims = useCallback((thicknessByDims: string) => {
        setState((prev) => ({ ...prev, thicknessByDims }));
    }, []);

    const setArea = useCallback((area: string) => {
        setState((prev) => ({ ...prev, area }));
    }, []);

    const setThicknessByArea = useCallback((thicknessByArea: string) => {
        setState((prev) => ({ ...prev, thicknessByArea }));
    }, []);

    const setHasCoffered = useCallback((hasCoffered: 'yes' | 'no') => {
        setState((prev) => ({
            ...prev,
            hasCoffered,
            cofferedSize: hasCoffered === 'yes' ? '10' : null,
        }));
    }, []);

    const setCofferedSize = useCallback((cofferedSize: CofferedSize) => {
        setState((prev) => ({ ...prev, cofferedSize }));
    }, []);

    return {
        ...state,
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
