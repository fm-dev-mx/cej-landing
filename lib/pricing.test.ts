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
import {
    MIN_M3_BY_TYPE,
    PRICE_TABLE,
    VAT_RATE,
} from '@/config/business';

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
            const str = '200';
            const min = MIN_M3_BY_TYPE[type];

            const result = normalizeVolume(1.0, type, str);

            expect(result.requestedM3).toBe(1.0);
            expect(result.roundedM3).toBe(1.0);
            expect(result.billedM3).toBe(min);
            expect(result.isBelowMinimum).toBe(true);
        });

        it('should enforce minimum volume for pumped service', () => {
            const type = 'pumped';
            const str = '200';
            const min = MIN_M3_BY_TYPE[type];

            const result = normalizeVolume(2.5, type, str);

            expect(result.billedM3).toBe(min);
            expect(result.isBelowMinimum).toBe(true);
        });

        it('should enforce overridden minimum volume for mortero 90', () => {
            const type = 'direct';
            const str = 'mortero 90';
            const min = 1; // Overridden

            const result = normalizeVolume(0.5, type, str);

            expect(result.requestedM3).toBe(0.5);
            expect(result.roundedM3).toBe(0.5);
            expect(result.billedM3).toBe(min);
            expect(result.isBelowMinimum).toBe(true);

            const result2 = normalizeVolume(1.5, type, str);
            expect(result2.billedM3).toBe(1.5);
            expect(result2.isBelowMinimum).toBe(false);
        });

        it('should use rounded volume if above minimum', () => {
            const type = 'direct';
            const str = '200';

            const result = normalizeVolume(3.1, type, str);

            expect(result.roundedM3).toBe(3.5);
            expect(result.billedM3).toBe(3.5);
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
            const expected = 4.9;

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
            const expected = 5.4;

            expect(calcVolumeFromDimensions(input)).toBeCloseTo(expected);
        });

        it.each([
            [0, 5], [10, -5], [-10, -5], [NaN, 5], [5, Infinity], [-Infinity, 5],
        ])('rejects invalid dimensions %s × %s before multiplying them', (lengthM, widthM) => {
            const base = { hasCofferedSlab: false, cofferedSize: null, manualThicknessCm: 10 };
            expect(calcVolumeFromDimensions({ ...base, lengthM, widthM })).toBe(0);
        });

        it('calculates volume from area (solid slab)', () => {
            const input: SlabAreaInput = {
                areaM2: 50,
                manualThicknessCm: 10,
                hasCofferedSlab: false,
                cofferedSize: null
            };
            // 50 * 0.10 = 5 m3 * 0.98
            const expected = 4.9;

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
            const expected = 6.75;

            expect(calcVolumeFromArea(input)).toBeCloseTo(expected);
        });

        it.each([0, -1, NaN, Infinity, -Infinity])('rejects invalid area or thickness: %s', (invalid) => {
            const base = { hasCofferedSlab: false, cofferedSize: null };
            expect(calcVolumeFromArea({ ...base, areaM2: invalid, manualThicknessCm: 10 })).toBe(0);
            expect(calcVolumeFromArea({ ...base, areaM2: 50, manualThicknessCm: invalid })).toBe(0);
        });

        it('requires a coffered size instead of silently calculating a solid slab', () => {
            expect(calcVolumeFromArea({
                areaM2: 50, manualThicknessCm: 10, hasCofferedSlab: true, cofferedSize: null,
            })).toBe(0);
        });
    });

    describe('calcQuote (Financials)', () => {
        it.each([0, -1, NaN, Infinity, -Infinity])('returns an empty quote for invalid volume %s, including fiber', (volume) => {
            const quote = calcQuote(volume, '200', 'direct', undefined, { hasFiber: true });
            expect(quote).toMatchObject({
                hasFiber: false, unitPricePerM3: 0, fiberSubtotal: 0, subtotal: 0, vat: 0, total: 0,
            });
        });

        it('splits included VAT from the gross unit rate', () => {
            const vol = 5;
            const strength = '250';
            const type = 'direct';

            const quote = calcQuote(vol, strength, type);

            expect(quote.volume.billedM3).toBe(5);
            expect(quote.unitPricePerM3).toBe(3025);

            const subtotal = quote.subtotal;
            const vat = quote.vat;
            const total = quote.total;

            expect(subtotal + vat).toBeCloseTo(total, 2);
            expect(vat).toBeCloseTo(total - subtotal, 2);
            expect(subtotal).toBe(Math.round(total / (1 + VAT_RATE) * 100) / 100);
            expect(subtotal).toBe(quote.volume.billedM3 * quote.unitPricePerM3);
            expect(total).toBe(quote.volume.billedM3 * 3267);
        });

        it('handles minimum volume billing correctly', () => {
            const quote = calcQuote(1, '200', 'direct');

            expect(quote.volume.requestedM3).toBe(1);
            expect(quote.volume.billedM3).toBe(2);
            expect(quote.unitPricePerM3).toBe(3129.63);
            expect(quote.subtotal).toBe(6259.26);
            expect(quote.vat).toBe(500.74);
            expect(quote.total).toBe(6760);
            expect(quote.total).toBe(quote.subtotal + quote.vat);
        });

        it('quotes MOREST 90 and MR 42.5 from one cubic meter', () => {
            const morest = calcQuote(1, 'mortero 90', 'direct');
            const mr = calcQuote(1, 'MR 42.5', 'direct');

            expect(morest.volume.billedM3).toBe(1);
            expect(morest.unitPricePerM3).toBe(4124.07);
            expect(morest.total).toBe(4454);
            expect(mr.volume.billedM3).toBe(1);
            expect(mr.unitPricePerM3).toBe(3145.37);
            expect(mr.total).toBe(3397);
        });

        it('breaks fiber out of the concrete unit price and splits VAT from the total', () => {
            const quote = calcQuote(2, '200', 'direct', undefined, { hasFiber: true });

            expect(quote.hasFiber).toBe(true);
            expect(quote.unitPricePerM3).toBe(3129.63);
            expect(quote.fiberSubtotal).toBe(240.74);
            expect(quote.subtotal).toBe(6500);
            expect(quote.vat).toBe(520);
            expect(quote.total).toBe(7020);
            expect(quote.subtotal + quote.vat).toBe(quote.total);
        });

        it('includes fiber in pumped quotes while rejecting unlisted mixes', () => {
            const quote = calcQuote(3, '200', 'pumped', undefined, { hasFiber: true });

            expect(quote.hasFiber).toBe(true);
            expect(quote.unitPricePerM3).toBe(3382.41);
            expect(quote.fiberSubtotal).toBe(361.11);
            expect(quote.subtotal).toBe(10508.33);
            expect(quote.total).toBe(11349);
            expect(quote.subtotal + quote.vat).toBe(quote.total);
            expect(calcQuote(3, '150 3/8', 'pumped').total).toBe(0);
            expect(calcQuote(3, '100', 'pumped').total).toBe(0);
        });

        it('does not silently omit fiber when its rate is missing', () => {
            const quote = calcQuote(3, '200', 'direct', { base: PRICE_TABLE.base }, { hasFiber: true });
            expect(quote.total).toBe(0);
            expect(quote.hasFiber).toBe(false);
        });
    });
});
