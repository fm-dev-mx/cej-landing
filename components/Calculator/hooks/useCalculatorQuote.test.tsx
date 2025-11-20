// components/Calculator/hooks/useCalculatorQuote.test.tsx
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useCalculatorQuote } from './useCalculatorQuote';
import { MIN_M3_BY_TYPE } from '@/config/business';

// Mock pixel to avoid undefined 'window' errors or real calls
vi.mock('@/lib/pixel', () => ({
  trackViewContent: vi.fn(),
}));

describe('useCalculatorQuote Hook', () => {
  const baseInput = {
    mode: null,
    m3: '',
    volumeMode: 'dimensions' as const,
    length: '',
    width: '',
    thicknessByDims: '12',
    area: '',
    thicknessByArea: '12',
    hasCoffered: 'no' as const,
    strength: '200' as const,
    type: 'direct' as const,
  };

  it('should return empty state initially', () => {
    const { result } = renderHook(() => useCalculatorQuote(baseInput));

    expect(result.current.billedM3).toBe(0);
    expect(result.current.quote.total).toBe(0);
    expect(result.current.canProceedToSummary).toBe(false);
  });

  it('should calculate correctly with Known Volume mode', () => {
    const input = {
      ...baseInput,
      mode: 'knownM3' as const,
      m3: '5',
    };

    const { result } = renderHook(() => useCalculatorQuote(input));

    expect(result.current.requestedM3).toBe(5);
    expect(result.current.billedM3).toBe(5);
    expect(result.current.quote.total).toBeGreaterThan(0);
    expect(result.current.volumeError).toBeNull();
    expect(result.current.canProceedToSummary).toBe(true);
  });

  it('should handle minimum volume warning', () => {
    const input = {
      ...baseInput,
      mode: 'knownM3' as const,
      m3: '1', // Less than min (2)
    };

    const { result } = renderHook(() => useCalculatorQuote(input));

    expect(result.current.requestedM3).toBe(1);
    expect(result.current.billedM3).toBe(MIN_M3_BY_TYPE.direct); // Should bump to 2

    // Should generate a warning, not an error
    expect(result.current.volumeError).toBeNull();
    expect(result.current.volumeWarning?.code).toBe('BELOW_MINIMUM');
  });

  it('should validate dimensions input', () => {
    const input = {
      ...baseInput,
      mode: 'assistM3' as const,
      volumeMode: 'dimensions' as const,
      length: '10',
      width: '5',
      thicknessByDims: '0', // Invalid thickness
    };

    const { result } = renderHook(() => useCalculatorQuote(input));

    // Thickness 0 should trigger error from Zod schema
    expect(result.current.volumeError).toBeTruthy();
    expect(result.current.canProceedToSummary).toBe(false);
  });

  it('should calculate volume from dimensions', () => {
    const input = {
      ...baseInput,
      mode: 'assistM3' as const,
      volumeMode: 'dimensions' as const,
      length: '10',
      width: '5',
      thicknessByDims: '10', // 10cm = 0.1m
    };

    // 10 * 5 * 0.1 = 5m3
    // Solid slab factor = 0.98 => ~4.9m3
    // Rounded to 0.5 step => 5.0m3

    const { result } = renderHook(() => useCalculatorQuote(input));

    expect(result.current.billedM3).toBe(5);
    expect(result.current.volumeError).toBeNull();
  });
});
