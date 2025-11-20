// components/Calculator/hooks/useCalculatorQuote.test.tsx
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useCalculatorQuote } from './useCalculatorQuote';
import { MIN_M3_BY_TYPE, CASETON_FACTORS } from '@/config/business';

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

  it('should calculate volume from dimensions (Solid Slab)', () => {
    const input = {
      ...baseInput,
      mode: 'assistM3' as const,
      volumeMode: 'dimensions' as const,
      length: '10',
      width: '5',
      thicknessByDims: '10', // 10cm = 0.1m
      hasCoffered: 'no' as const,
    };

    // Logic: 10 * 5 * 0.1 = 5 m³
    // Solid Factor: 0.98 => 4.9 m³
    // Rounded Step (0.5): => 5.0 m³

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

    // Logic: 50 * 0.1 = 5 m³
    // Solid Factor: 0.98 => 4.9 m³
    // Rounded Step (0.5): => 5.0 m³

    const { result } = renderHook(() => useCalculatorQuote(input));

    expect(result.current.billedM3).toBe(5);
  });

  it('should apply coffered slab reduction factor', () => {
    const input = {
      ...baseInput,
      mode: 'assistM3' as const,
      volumeMode: 'dimensions' as const,
      length: '10',
      width: '10',
      thicknessByDims: '20', // 0.2m
      hasCoffered: 'yes' as const,
    };

    // Logic: 10 * 10 * 0.2 = 20 m³
    // Coffered Factor: 0.71 (CASETON_FACTORS.withCofferedSlab)
    // Expected Raw: 14.2 m³
    // Rounded Step (0.5): => 14.5 m³

    const { result } = renderHook(() => useCalculatorQuote(input));

    // Verify factor was applied (significantly less than 20)
    expect(result.current.requestedM3).toBeCloseTo(20 * CASETON_FACTORS.withCofferedSlab);
    expect(result.current.billedM3).toBe(14.5);
  });
});
