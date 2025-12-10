// File: hooks/useQuoteCalculator.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQuoteCalculator } from './useQuoteCalculator';
import { DEFAULT_CALCULATOR_STATE } from '@/types/domain';
import { CASETON_FACTORS } from '@/config/business'; // Imported to avoid magic numbers

describe('useQuoteCalculator Logic', () => {
    it('returns empty result when mode is null', () => {
        const { result } = renderHook(() => useQuoteCalculator(DEFAULT_CALCULATOR_STATE));

        expect(result.current.isValid).toBe(false);
        expect(result.current.quote.total).toBe(0);
    });

    it('calculates correctly for Known Volume (Mode 1)', () => {
        const input = {
            ...DEFAULT_CALCULATOR_STATE,
            mode: 'knownM3' as const,
            m3: '10',
            strength: '250' as const,
            type: 'direct' as const
        };

        const { result } = renderHook(() => useQuoteCalculator(input));

        expect(result.current.isValid).toBe(true);
        expect(result.current.rawVolume).toBe(10);
        expect(result.current.quote.total).toBeGreaterThan(0);
        expect(result.current.error).toBeNull();
    });

    it('calculates correctly for Dimensions (Mode 2)', () => {
        const length = 10;
        const width = 5;
        const thickness = 0.1; // 10cm converted to meters

        const input = {
            ...DEFAULT_CALCULATOR_STATE,
            mode: 'assistM3' as const,
            volumeMode: 'dimensions' as const,
            length: length.toString(),
            width: width.toString(),
            thicknessByDims: '10', // 10cm
            strength: '200' as const,
            type: 'pumped' as const
        };

        // Use the Single Source of Truth for the factor (Solid Slab)
        const solidSlabFactor = CASETON_FACTORS.solidSlab; // e.g., 0.98
        const expectedVolume = length * width * thickness * solidSlabFactor;

        const { result } = renderHook(() => useQuoteCalculator(input));

        expect(result.current.isValid).toBe(true);
        // Compare with floating point precision
        expect(result.current.rawVolume).toBeCloseTo(expectedVolume);
    });

    it('returns error for invalid dimensions', () => {
        const input = {
            ...DEFAULT_CALCULATOR_STATE,
            mode: 'assistM3' as const,
            volumeMode: 'dimensions' as const,
            length: '0', // Invalid length
            width: '5',
            thicknessByDims: '10'
        };

        const { result } = renderHook(() => useQuoteCalculator(input));

        expect(result.current.isValid).toBe(false);
        expect(result.current.error).toBeTruthy();
    });

    it('generates rounding warning for small volumes', () => {
        const input = {
            ...DEFAULT_CALCULATOR_STATE,
            mode: 'knownM3' as const,
            m3: '0.2', // Very small volume (below minimums)
            type: 'direct' as const
        };

        const { result } = renderHook(() => useQuoteCalculator(input));

        // Business rule: Should warn about minimum order adjustments
        expect(result.current.warning).not.toBeNull();
        expect(result.current.isValid).toBe(true); // Still valid, but with warning
    });
});
