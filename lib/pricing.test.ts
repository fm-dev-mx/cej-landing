// lib/pricing.test.ts
import { describe, it, expect } from 'vitest';
import {
    roundUpToStep,
    normalizeVolume,
    calcVolumeFromDimensions,
    calcVolumeFromArea,
    calcQuote,
    type SlabDimensionsInput,
    type SlabAreaInput
} from './pricing';
import { CASETON_FACTORS, MIN_M3_BY_TYPE, VAT_RATE, COFFERED_SPECS } from '@/config/business';

describe('Pricing Logic', () => {

    describe('roundUpToStep', () => {
        it('should round up to the nearest 0.5 step', () => {
            expect(roundUpToStep(0.1, 0.5)).toBe(0.5);
            expect(roundUpToStep(0.4, 0.5)).toBe(0.5);
            expect(roundUpToStep(0.5, 0.5)).toBe(0.5);
            expect(roundUpToStep(0.6, 0.5)).toBe(1.0);
            expect(roundUpToStep(2.1, 0.5)).toBe(2.5);
        });

        it('should handle edge cases', () => {
            expect(roundUpToStep(0, 0.5)).toBe(0);
            expect(roundUpToStep(-1, 0.5)).toBe(0);
        });
    });

    describe('normalizeVolume', () => {
        it('should enforce minimum volume for direct service', () => {
            const type = 'direct';
            const min = MIN_M3_BY_TYPE[type];

            const result = normalizeVolume(1.0, type);

            expect(result.requestedM3).toBe(1.0);
            expect(result.roundedM3).toBe(1.0);
            expect(result.billedM3).toBe(min);
            expect(result.isBelowMinimum).toBe(true);
        });

        it('should enforce minimum volume for pumped service', () => {
            const type = 'pumped';
            const min = MIN_M3_BY_TYPE[type];

            const result = normalizeVolume(2.5, type);

            expect(result.billedM3).toBe(min);
            expect(result.isBelowMinimum).toBe(true);
        });

        it('should use rounded volume if above minimum', () => {
            const type = 'direct';

            const result = normalizeVolume(2.1, type);

            expect(result.roundedM3).toBe(2.5);
            expect(result.billedM3).toBe(2.5);
            expect(result.isBelowMinimum).toBe(false);
        });
    });

    describe('Volume Calculators', () => {
        it('calculates volume from dimensions (solid slab)', () => {
            const input: SlabDimensionsInput = {
                lengthM: 10,
                widthM: 5,
                manualThicknessCm: 10,
                hasCofferedSlab: false,
                cofferedSize: null
            };
            // 10 * 5 * 0.10 = 5 m3
            // Factor solid = 0.98
            const expected = 5 * CASETON_FACTORS.solidSlab;

            expect(calcVolumeFromDimensions(input)).toBeCloseTo(expected);
        });

        it('calculates volume from dimensions (coffered slab)', () => {
            const size = '10'; // 10cm casetón
            const input: SlabDimensionsInput = {
                lengthM: 10,
                widthM: 5,
                manualThicknessCm: 0, // Ignored
                hasCofferedSlab: true,
                cofferedSize: size,
            };

            // Area = 50 m2
            // Spec 10cm -> coefficient 0.108
            const expected = 50 * COFFERED_SPECS[size].coefficient;

            expect(calcVolumeFromDimensions(input)).toBeCloseTo(expected);
        });

        it('returns 0 for invalid dimensions inputs', () => {
            const base = { hasCofferedSlab: false, cofferedSize: null, manualThicknessCm: 10 };
            expect(calcVolumeFromDimensions({ ...base, lengthM: 0, widthM: 5 })).toBe(0);
            expect(calcVolumeFromDimensions({ ...base, lengthM: 10, widthM: -5 })).toBe(0);
        });

        it('calculates volume from area (solid slab)', () => {
            const input: SlabAreaInput = {
                areaM2: 50,
                manualThicknessCm: 10,
                hasCofferedSlab: false,
                cofferedSize: null
            };
            // 50 * 0.10 = 5 m3 * 0.98
            const expected = 5 * CASETON_FACTORS.solidSlab;

            expect(calcVolumeFromArea(input)).toBeCloseTo(expected);
        });

        it('calculates volume from area (coffered slab)', () => {
            const size = '15'; // 15cm casetón
            const input: SlabAreaInput = {
                areaM2: 50,
                manualThicknessCm: 0, // Ignored
                hasCofferedSlab: true,
                cofferedSize: size,
            };

            // Area = 50
            // Spec 15cm -> coefficient 0.135
            const expected = 50 * COFFERED_SPECS[size].coefficient;

            expect(calcVolumeFromArea(input)).toBeCloseTo(expected);
        });

        it('returns 0 for invalid area inputs', () => {
            const base = { hasCofferedSlab: false, cofferedSize: null };
            expect(calcVolumeFromArea({ ...base, areaM2: 0, manualThicknessCm: 10 })).toBe(0);
            expect(calcVolumeFromArea({ ...base, areaM2: 50, manualThicknessCm: -10 })).toBe(0);
        });
    });

    describe('calcQuote (Financials)', () => {
        it('returns empty quote for invalid input', () => {
            const quote = calcQuote(0, '200', 'direct');
            expect(quote.total).toBe(0);
        });

        it('calculates correct total including VAT for a standard order', () => {
            const vol = 5;
            const strength = '250';
            const type = 'direct';

            const quote = calcQuote(vol, strength, type);

            expect(quote.volume.billedM3).toBe(5);
            expect(quote.unitPricePerM3).toBeGreaterThan(0);

            const subtotal = quote.subtotal;
            const vat = quote.vat;
            const total = quote.total;

            expect(subtotal + vat).toBeCloseTo(total, 2);
            const expectedVat = subtotal * VAT_RATE;
            expect(vat).toBeCloseTo(expectedVat, 0);
        });

        it('handles minimum volume billing correctly', () => {
            const quote = calcQuote(1, '200', 'direct');

            expect(quote.volume.requestedM3).toBe(1);
            expect(quote.volume.billedM3).toBe(2);
            expect(quote.subtotal).toBe(quote.volume.billedM3 * quote.unitPricePerM3);
        });
    });
});
