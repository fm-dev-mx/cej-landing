'use client';

import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react';
// IMPORT CRUCIAL PARA EVITAR RENDER INFINITO
import { useShallow } from 'zustand/react/shallow';
import { useCejStore } from '@/store/useCejStore';
import { useQuoteCalculator } from '@/hooks/useQuoteCalculator';
import type {
  QuoteBreakdown,
  QuoteWarning,
  CalculatorState,
  Step,
  CalculatorMode,
  WorkTypeId,
  AssistVolumeMode,
  Strength,
  ConcreteType,
  CofferedSize
} from '../types';

// State Actions Interface
type CalculatorActions = {
  resetCalculator: () => void;
  setStep: (step: Step) => void;
  setMode: (mode: CalculatorMode | null) => void;
  setWorkType: (id: WorkTypeId | null) => void;
  setVolumeMode: (mode: AssistVolumeMode) => void;
  setStrength: (s: Strength) => void;
  setType: (t: ConcreteType) => void;
  setM3: (v: string) => void;
  setLength: (v: string) => void;
  setWidth: (v: string) => void;
  setArea: (v: string) => void;
  setThicknessByDims: (v: string) => void;
  setThicknessByArea: (v: string) => void;
  setHasCoffered: (v: 'yes' | 'no') => void;
  setCofferedSize: (v: CofferedSize | null) => void;
};

// Result Interface
type CalculatorResult = {
  quote: QuoteBreakdown;
  rawVolume: number;
  isValid: boolean;
  volumeError: string | null;
  volumeWarning: QuoteWarning; // QuoteWarning includes null in types.ts
  billedM3: number;
  requestedM3: number;
  isCalculating: boolean;
  simulateCalculation: (cb: () => void) => void;
};

export type CalculatorContextType = CalculatorState & CalculatorActions & CalculatorResult;

const CalculatorContext = createContext<CalculatorContextType | null>(null);

export function CalculatorProvider({ children }: { children: ReactNode }) {
  // 1. Store State (Stable selection)
  const draft = useCejStore((s) => s.draft);

  // 2. Store Actions (Stable selection with useShallow)
  // Esto previene que se cree un objeto nuevo en cada render
  const actions = useCejStore(
    useShallow((s) => ({
      resetCalculator: s.resetDraft,
      setStep: s.setStep,
      setMode: s.setMode,
      setWorkType: s.setWorkType,
      setVolumeMode: s.setVolumeMode,
      setStrength: s.setStrength,
      setType: s.setType,
      setM3: s.setM3,
      setLength: s.setLength,
      setWidth: s.setWidth,
      setArea: s.setArea,
      setThicknessByDims: s.setThicknessByDims,
      setThicknessByArea: s.setThicknessByArea,
      setHasCoffered: s.setHasCoffered,
      setCofferedSize: s.setCofferedSize
    }))
  );

  // 3. Logic Hook (Unified)
  const calculation = useQuoteCalculator(draft);

  // 4. UX Simulation
  const [isCalculating, setIsCalculating] = useState(false);
  const simulateCalculation = useCallback((onComplete: () => void) => {
    setIsCalculating(true);
    // Simular un pequeño delay para dar feedback visual
    setTimeout(() => {
      setIsCalculating(false);
      onComplete();
    }, 600);
  }, []);

  const value = useMemo(() => ({
    ...draft,
    ...actions,
    ...calculation,
    billedM3: calculation.quote.volume.billedM3,
    requestedM3: calculation.quote.volume.requestedM3,
    volumeError: calculation.error,
    volumeWarning: calculation.warning,
    isCalculating,
    simulateCalculation
  }), [draft, actions, calculation, isCalculating, simulateCalculation]);

  return (
    <CalculatorContext.Provider value={value}>
      {children}
    </CalculatorContext.Provider>
  );
}

export function useCalculatorContext() {
  const context = useContext(CalculatorContext);
  if (!context) {
    throw new Error('useCalculatorContext must be used within a CalculatorProvider');
  }
  return context;
}
