// components/Calculator/hooks/useCalculatorQuote.test.tsx
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useCalculatorQuote } from './useCalculatorQuote';
import { MIN_M3_BY_TYPE, COFFERED_SPECS } from '@/config/business';

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
    cofferedSize: null,
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
      m3: '1',
    };

    const { result } = renderHook(() => useCalculatorQuote(input));

    expect(result.current.requestedM3).toBe(1);
    expect(result.current.billedM3).toBe(MIN_M3_BY_TYPE.direct);

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
      thicknessByDims: '0',
    };

    const { result } = renderHook(() => useCalculatorQuote(input));

    expect(result.current.volumeError).toBeTruthy();
    expect(result.current.canProceedToSummary).toBe(false);
  });

  it('should calculate volume from dimensions (Solid Slab)', () => {
    const input = {
      ...baseInput,
      mode: 'assistM3' as const,
      volumeMode: 'dimensions' as const,
      length: '10',
      width: '5',
      thicknessByDims: '10',
      hasCoffered: 'no' as const,
    };

    const { result } = renderHook(() => useCalculatorQuote(input));

    expect(result.current.billedM3).toBe(5);
    expect(result.current.volumeError).toBeNull();
  });

  it('should calculate volume from Area', () => {
    const input = {
      ...baseInput,
      mode: 'assistM3' as const,
      volumeMode: 'area' as const,
      area: '50',
      thicknessByArea: '10',
      hasCoffered: 'no' as const,
    };

    const { result } = renderHook(() => useCalculatorQuote(input));

    expect(result.current.billedM3).toBe(5);
  });

  it('should apply coffered slab reduction factor', () => {
    const size = '10'; // 10cm casetón
    const input = {
      ...baseInput,
      mode: 'assistM3' as const,
      volumeMode: 'dimensions' as const,
      length: '10',
      width: '10',
      // thickness input is irrelevant for coffered logic inside hook now,
      // but we need it to pass Zod schema if not bypassing.
      // The hook handles the bypass, so any string here is fine if not 'yes'.
      thicknessByDims: '0',
      hasCoffered: 'yes' as const,
      cofferedSize: size as any,
    };

    // Logic: 10 * 10 = 100 m2
    // Coefficient for 10cm = 0.108
    // Expected Raw = 10.8 m3
    // Rounded Step (0.5) -> 11.0 m3

    const { result } = renderHook(() => useCalculatorQuote(input));

    const expectedRaw = 100 * COFFERED_SPECS[size].coefficient;

    expect(result.current.requestedM3).toBeCloseTo(expectedRaw);
    expect(result.current.billedM3).toBe(11.0);
  });
});
