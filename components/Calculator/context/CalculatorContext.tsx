// components/Calculator/context/CalculatorContext.tsx
'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useCalculatorState } from '../hooks/useCalculatorState';
import { useCalculatorQuote } from '../hooks/useCalculatorQuote';

// Infer return types to avoid duplication
type StateHook = ReturnType<typeof useCalculatorState>;
type QuoteHook = ReturnType<typeof useCalculatorQuote>;

// Context exposes everything: state, setters, and calculated quote
export type CalculatorContextType = StateHook & QuoteHook;

const CalculatorContext = createContext<CalculatorContextType | null>(null);

export function CalculatorProvider({ children }: { children: ReactNode }) {
  // 1. Initialize state
  const state = useCalculatorState();

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
    strength: state.strength,
    type: state.type,
  });

  // 3. Combine everything into a single memoized object to avoid unnecessary re-renders
  const value = useMemo(() => ({
    ...state,
    ...quoteData,
  }), [state, quoteData]);

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
