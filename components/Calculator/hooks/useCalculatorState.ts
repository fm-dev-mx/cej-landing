// components/Calculator/hooks/useCalculatorState.ts

import { useCallback, useEffect, useState } from 'react';
import {
    DEFAULT_CALCULATOR_STATE,
    STORAGE_KEY,
    WORK_TYPES,
    type AssistVolumeMode,
    type CalculatorMode,
    type CalculatorState,
    type Step,
    type Strength,
    type ConcreteType,
    type WorkTypeId,
    type CofferedSize, // Importar el tipo
} from '../types';

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
            // ignore
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
                next.length = '';
                next.width = '';
                next.area = '';
            } else {
                next.m3 = '';
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
                cofferedSize: null, // Reset al cambiar de obra
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
            // Si activa casetón, por defecto ponemos 10cm, si desactiva, null
            cofferedSize: hasCoffered === 'yes' ? '10' : null
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
        setCofferedSize, // Exportamos el nuevo setter
    };
}
