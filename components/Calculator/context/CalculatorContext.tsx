// components/Calculator/context/CalculatorContext.tsx
'use client';

import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react';
import { useCalculatorState } from '../hooks/useCalculatorState';
import { useCalculatorQuote } from '../hooks/useCalculatorQuote';

// Infer return types to avoid duplication
type StateHook = ReturnType<typeof useCalculatorState>;
type QuoteHook = ReturnType<typeof useCalculatorQuote>;

// Context exposes everything: state, setters, calculated quote, and UI states
export type CalculatorContextType = StateHook & QuoteHook & {
  isCalculating: boolean;
  simulateCalculation: (onComplete: () => void) => void;
};

const CalculatorContext = createContext<CalculatorContextType | null>(null);

export function CalculatorProvider({ children }: { children: ReactNode }) {
  // 1. Initialize state
  const state = useCalculatorState();
  const [isCalculating, setIsCalculating] = useState(false);

  // 2. Calculate quote based on current state
  const quoteData = useCalculatorQuote({
    mode: state.mode,
    m3: state.m3,
    volumeMode: state.volumeMode,
    length: state.length,
    width: state.width,
    thicknessByDims: state.thicknessByDims,
    area: state.area,
    thicknessByArea: state.thicknessByArea,
    hasCoffered: state.hasCoffered,
    // FIX: Pass the cofferedSize state to the quote hook so it can calculate specs correctly
    cofferedSize: state.cofferedSize,
    strength: state.strength,
    type: state.type,
  });

  // 3. Simulation helper
  const simulateCalculation = useCallback((onComplete: () => void) => {
    setIsCalculating(true);
    // Random delay between 900ms and 1300ms for realism
    const delay = Math.floor(Math.random() * 400) + 900;

    setTimeout(() => {
      setIsCalculating(false);
      onComplete();
    }, delay);
  }, []);

  // 4. Combine everything into a single memoized object
  const value = useMemo(() => ({
    ...state,
    ...quoteData,
    isCalculating,
    simulateCalculation,
  }), [state, quoteData, isCalculating, simulateCalculation]);

  return (
    <CalculatorContext.Provider value={value}>
      {children}
    </CalculatorContext.Provider>
  );
}

// Custom hook to consume the context
export function useCalculatorContext() {
  const context = useContext(CalculatorContext);
  if (!context) {
    throw new Error('useCalculatorContext must be used within a CalculatorProvider');
  }
  return context;
}
