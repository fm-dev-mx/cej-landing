// lib/pricing.test.ts
import { describe, it, expect } from 'vitest';
import {
    roundUpToStep,
    normalizeVolume,
    calcVolumeFromDimensions,
    calcVolumeFromArea,
    calcQuote,
} from './pricing';
import { CASETON_FACTORS, MIN_M3_BY_TYPE, VAT_RATE } from '@/config/business';

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
            const min = MIN_M3_BY_TYPE[type]; // 2.0

            // Requesting 1.0 should round to 1.0 but bill at min (2.0)
            const result = normalizeVolume(1.0, type);

            expect(result.requestedM3).toBe(1.0);
            expect(result.roundedM3).toBe(1.0);
            expect(result.billedM3).toBe(min);
            expect(result.isBelowMinimum).toBe(true);
        });

        it('should enforce minimum volume for pumped service', () => {
            const type = 'pumped';
            const min = MIN_M3_BY_TYPE[type]; // 3.0

            const result = normalizeVolume(2.5, type);

            expect(result.billedM3).toBe(min);
            expect(result.isBelowMinimum).toBe(true);
        });

        it('should use rounded volume if above minimum', () => {
            const type = 'direct'; // min 2.0

            // Request 2.1 -> Rounds to 2.5 -> Billed 2.5
            const result = normalizeVolume(2.1, type);

            expect(result.roundedM3).toBe(2.5);
            expect(result.billedM3).toBe(2.5);
            expect(result.isBelowMinimum).toBe(false);
        });
    });

    describe('Volume Calculators', () => {
        it('calculates volume from dimensions (solid slab)', () => {
            const input = {
                lengthM: 10,
                widthM: 5,
                thicknessCm: 10,
                hasCofferedSlab: false,
            };
            // 10 * 5 * 0.10 = 5 m3
            // Factor solid = 0.98
            const expected = 5 * CASETON_FACTORS.solidSlab;

            expect(calcVolumeFromDimensions(input)).toBeCloseTo(expected);
        });

        it('calculates volume from dimensions (coffered slab)', () => {
            const input = {
                lengthM: 10,
                widthM: 5,
                thicknessCm: 20, // 0.2m
                hasCofferedSlab: true,
            };
            // 10 * 5 * 0.2 = 10 m3
            // Factor coffered = 0.71
            const expected = 10 * CASETON_FACTORS.withCofferedSlab;

            expect(calcVolumeFromDimensions(input)).toBeCloseTo(expected);
        });

        // NEW: Edge cases for dimensions
        it('returns 0 for invalid dimensions inputs', () => {
            expect(calcVolumeFromDimensions({ lengthM: 0, widthM: 5, thicknessCm: 10, hasCofferedSlab: false })).toBe(0);
            expect(calcVolumeFromDimensions({ lengthM: 10, widthM: -5, thicknessCm: 10, hasCofferedSlab: false })).toBe(0);
        });

        it('calculates volume from area (solid slab)', () => {
            const input = {
                areaM2: 50,
                thicknessCm: 10,
                hasCofferedSlab: false,
            };
            // 50 * 0.10 = 5 m3 * 0.98
            const expected = 5 * CASETON_FACTORS.solidSlab;

            expect(calcVolumeFromArea(input)).toBeCloseTo(expected);
        });

        // NEW: Coverage for Area + Coffered
        it('calculates volume from area (coffered slab)', () => {
            const input = {
                areaM2: 50,
                thicknessCm: 20,
                hasCofferedSlab: true,
            };
            // 50 * 0.20 = 10 m3 * 0.71
            const expected = 10 * CASETON_FACTORS.withCofferedSlab;

            expect(calcVolumeFromArea(input)).toBeCloseTo(expected);
        });

        // NEW: Edge cases for area
        it('returns 0 for invalid area inputs', () => {
            expect(calcVolumeFromArea({ areaM2: 0, thicknessCm: 10, hasCofferedSlab: false })).toBe(0);
            expect(calcVolumeFromArea({ areaM2: 50, thicknessCm: -10, hasCofferedSlab: false })).toBe(0);
        });
    });

    describe('calcQuote (Financials)', () => {
        it('returns empty quote for invalid input', () => {
            const quote = calcQuote(0, '200', 'direct');
            expect(quote.total).toBe(0);
        });

        it('calculates correct total including VAT for a standard order', () => {
            // Scenario: 5 m3, 250kg, Direct
            // Let's assume price per m3 is X (from business.ts).
            // We verify the math logic: Subtotal + VAT = Total

            const vol = 5;
            const strength = '250';
            const type = 'direct';

            const quote = calcQuote(vol, strength, type);

            expect(quote.volume.billedM3).toBe(5);
            expect(quote.unitPricePerM3).toBeGreaterThan(0);

            // Verify financial consistency
            const subtotal = quote.subtotal;
            const vat = quote.vat;
            const total = quote.total;

            // Allow small floating point diffs if any, but logic uses integers internally
            expect(subtotal + vat).toBeCloseTo(total, 2);

            // Verify VAT rate
            // Note: subtotal is derived from rounded cents, so exact rate check might vary by 0.01
            // but logically: vat ~ subtotal * 0.08
            const expectedVat = subtotal * VAT_RATE;
            expect(vat).toBeCloseTo(expectedVat, 0); // relaxed precision for integer rounding
        });

        it('handles minimum volume billing correctly', () => {
            // Request 1m3 direct (min is 2)
            // Should bill for 2m3 at the 2m3 tier price
            const quote = calcQuote(1, '200', 'direct');

            expect(quote.volume.requestedM3).toBe(1);
            expect(quote.volume.billedM3).toBe(2);
            expect(quote.subtotal).toBe(quote.volume.billedM3 * quote.unitPricePerM3);
        });
    });
});
