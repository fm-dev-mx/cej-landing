'use client';

import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react';
import { useCalculatorState } from '../hooks/useCalculatorState';
import { useQuoteCalculator } from '../../../hooks/useQuoteCalculator'; // Use the new Phase 1 hook
import { CONCRETE_TYPES } from '@/config/business';
import type { QuoteWarning } from '../types';

// Helper types to infer return values
type StateHook = ReturnType<typeof useCalculatorState>;
type QuoteData = ReturnType<typeof useQuoteCalculator>;

export type CalculatorContextType = StateHook & QuoteData & {
  isCalculating: boolean;
  simulateCalculation: (onComplete: () => void) => void;
  billedM3: number;
  requestedM3: number;
  volumeError: string | null;
  volumeWarning: QuoteWarning;
};

const CalculatorContext = createContext<CalculatorContextType | null>(null);

export function CalculatorProvider({ children }: { children: ReactNode }) {
  // 1. Get State (Now synced with Zustand)
  const state = useCalculatorState();

  // 2. Get Calculation (Using the pure hook created in Phase 1)
  const quoteData = useQuoteCalculator();

  const [isCalculating, setIsCalculating] = useState(false);

  // 3. Simulation helper (Keep UI feel)
  const simulateCalculation = useCallback((onComplete: () => void) => {
    setIsCalculating(true);
    const delay = Math.floor(Math.random() * 400) + 600; // Slightly faster for App
    setTimeout(() => {
      setIsCalculating(false);
      onComplete();
    }, delay);
  }, []);

  const value = useMemo(() => {
    // Extract volume properties
    const {
      requestedM3: normalizedRequested,
      billedM3: normalizedBilled,
      minM3ForType,
      roundedM3,
      isBelowMinimum,
    } = quoteData.quote.volume;

    // Determine Warnings
    let warning: QuoteWarning = null;
    const typeLabel = CONCRETE_TYPES.find((t) => t.value === state.type)?.label ?? state.type;

    if (isBelowMinimum) {
      warning = {
        code: 'BELOW_MINIMUM',
        minM3: minM3ForType,
        billedM3: normalizedBilled,
        typeLabel,
      };
    } else if (normalizedBilled !== normalizedRequested) {
      warning = {
        code: 'ROUNDING_POLICY',
        requestedM3: normalizedRequested,
        billedM3: normalizedBilled,
      };
    } else if (roundedM3 !== normalizedRequested) {
      warning = {
        code: 'ROUNDING_ADJUSTMENT',
        billedM3: normalizedBilled,
      };
    }

    return {
      ...state,
      ...quoteData,
      billedM3: normalizedBilled,
      requestedM3: normalizedRequested,
      volumeError: quoteData.isValid ? null : 'Revisa los datos', // Simplified error mapping
      volumeWarning: warning,
      isCalculating,
      simulateCalculation,
    };
  }, [state, quoteData, isCalculating, simulateCalculation]);

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
