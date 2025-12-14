// lib/pricing.test.ts
import { describe, it, expect } from 'vitest';
import { calcQuote, normalizeVolume, roundUpToStep, toPesos, calcVolumeFromArea, calcVolumeFromDimensions } from '@/lib/pricing';
import type { PricingRules } from '@/lib/schemas/pricing';

// --- Constants & Mocks ---
const ADDITIVE_FIBER_ID = 'fiber';
const ADDITIVE_ANTIDOTO_ID = 'antidoto';

const MOCK_RULES: PricingRules = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    vatRate: 0.16,
    currency: 'MXN',
    minOrderQuantity: {
        direct: 1.0,
        pumped: 3.0
    },
    additives: [
        {
            id: ADDITIVE_FIBER_ID, // Uso de constante
            label: 'Fibra',
            priceCents: 5000, // $50.00
            pricingModel: 'per_m3',
            active: true
        },
        {
            id: ADDITIVE_ANTIDOTO_ID, // Uso de constante
            label: 'Antídoto',
            priceCents: 25000, // $250.00
            pricingModel: 'fixed_per_load',
            active: true
        }
    ],
    base: {
        direct: {
            '200': [
                { minM3: 0, maxM3: 10, pricePerM3Cents: 200000 }, // $2,000
                { minM3: 10.5, pricePerM3Cents: 190000 } // $1,900 (Volume discount)
            ],
            '250': [
                { minM3: 0, pricePerM3Cents: 210000 }
            ]
        },
        pumped: {
            '200': [
                { minM3: 0, pricePerM3Cents: 220000 } // $2,200
            ]
        }
    } as PricingRules['base']
};

describe('Pricing Engine (Core Logic)', () => {

    describe('Math Utilities', () => {
        it('roundUpToStep rounds up to nearest 0.5', () => {
            expect(roundUpToStep(0.1, 0.5)).toBe(0.5);
            expect(roundUpToStep(0.5, 0.5)).toBe(0.5);
            expect(roundUpToStep(0.51, 0.5)).toBe(1.0);
            expect(roundUpToStep(4.2, 0.5)).toBe(4.5);
        });

        it('roundUpToStep handles edge cases', () => {
            expect(roundUpToStep(0, 0.5)).toBe(0);
            expect(roundUpToStep(-5, 0.5)).toBe(0);
            expect(roundUpToStep(NaN, 0.5)).toBe(0);
        });

        it('toPesos converts cents to readable currency', () => {
            expect(toPesos(100)).toBe(1);
            expect(toPesos(123456)).toBe(1234.56);
            expect(toPesos(0)).toBe(0);
        });
    });

    describe('Volume Normalization (normalizeVolume)', () => {
        it('enforces Minimum Order Quantity (MOQ)', () => {
            // Request 1m3, MOQ is 3m3 (pumped)
            const result = normalizeVolume(1, 'pumped', MOCK_RULES);

            expect(result.requestedM3).toBe(1);
            expect(result.billedM3).toBe(3.0); // Billed amount bumped to MOQ
            expect(result.isBelowMinimum).toBe(true);
        });

        it('rounds up volume to step before checking MOQ', () => {
            // Request 3.2m3 -> Rounds to 3.5m3. MOQ 3.0.
            const result = normalizeVolume(3.2, 'pumped', MOCK_RULES);

            expect(result.roundedM3).toBe(3.5);
            expect(result.billedM3).toBe(3.5);
            expect(result.isBelowMinimum).toBe(false);
        });

        it('handles zero or negative input gracefully', () => {
            const result = normalizeVolume(-10, 'direct', MOCK_RULES);
            expect(result.billedM3).toBe(0);
            expect(result.requestedM3).toBe(0);
        });
    });

    describe('Quote Calculation (calcQuote)', () => {

        it('calculates base price correctly (Simple Tier)', () => {
            // 5m3 of Direct 200 -> $2,000 * 5 = $10,000 + IVA
            const quote = calcQuote(5, {
                strength: '200',
                type: 'direct',
                additives: []
            }, MOCK_RULES);

            expect(quote.baseSubtotal).toBe(10000);
            expect(quote.vat).toBe(1600);
            expect(quote.total).toBe(11600);
            expect(quote.unitPricePerM3).toBe(2000);
        });

        it('applies volume discounts (Tier Logic)', () => {
            // 11m3 of Direct 200 -> Tier 2 ($1,900)
            const quote = calcQuote(11, {
                strength: '200',
                type: 'direct',
                additives: []
            }, MOCK_RULES);

            expect(quote.unitPricePerM3).toBe(1900);
            expect(quote.baseSubtotal).toBe(11 * 1900);
        });

        it('handles per_m3 additives (Fiber)', () => {
            // 2m3 + Fiber ($50/m3)
            const quote = calcQuote(2, {
                strength: '200',
                type: 'direct',
                additives: [ADDITIVE_FIBER_ID]
            }, MOCK_RULES);

            // Base: 2 * 2000 = 4000
            // Fiber: 2 * 50 = 100
            expect(quote.baseSubtotal).toBe(4000);
            expect(quote.additivesSubtotal).toBe(100);
            expect(quote.subtotal).toBe(4100);
        });

        it('handles fixed_per_load additives (Antidoto)', () => {
            const quote = calcQuote(5, {
                strength: '200',
                type: 'direct',
                additives: [ADDITIVE_ANTIDOTO_ID]
            }, MOCK_RULES);

            expect(quote.additivesSubtotal).toBe(250);
        });

        it('ignores invalid/inactive additives', () => {
            const quote = calcQuote(5, {
                strength: '200',
                type: 'direct',
                additives: ['invalid_id', ADDITIVE_FIBER_ID]
            }, MOCK_RULES);

            // Solo cobra fibra
            expect(quote.additivesSubtotal).toBe(5 * 50);
        });

        it('returns EMPTY_QUOTE for invalid volumes', () => {
            const quote = calcQuote(0, { strength: '200', type: 'direct', additives: [] }, MOCK_RULES);

            expect(quote).toEqual(expect.objectContaining({
                total: 0,
                volume: expect.objectContaining({
                    billedM3: 0
                })
            }));
        });

        it('falls back to highest tier if volume exceeds all defined maxM3', () => {
            // Logic: if volume > last tier max, use last tier price
            // Our mock has last tier starting at 10.5 with no maxM3.
            const quote = calcQuote(100, {
                strength: '200',
                type: 'direct',
                additives: []
            }, MOCK_RULES);

            expect(quote.unitPricePerM3).toBe(1900);
        });
    });
});

describe('Volume Calculation (Geometric)', () => {

    describe('calcVolumeFromArea', () => {

        it('calculates solid slab volume correctly (with solidSlab factor)', () => {
            // 20m² * 12cm thickness * 0.98 (solidSlab factor) = 20 * 0.12 * 0.98 = 2.352m³
            const volume = calcVolumeFromArea({
                areaM2: 20,
                hasCofferedSlab: false,
                cofferedSize: null,
                manualThicknessCm: 12
            });

            expect(volume).toBeCloseTo(2.352, 2);
        });

        it('calculates coffered slab volume with standard compression layer', () => {
            // 20m² with 7cm cassette (coef 0.085). Standard 5cm compression included.
            const volume = calcVolumeFromArea({
                areaM2: 20,
                hasCofferedSlab: true,
                cofferedSize: '7',
                manualThicknessCm: undefined // Uses standard coefficient
            });

            // 20 * 0.085 = 1.7
            expect(volume).toBeCloseTo(1.7, 1);
        });

        it('calculates coffered slab with CUSTOM compression layer (edge case)', () => {
            // 20m² with 7cm cassette (coef 0.085), custom 6cm compression.
            // Formula: area * (ribsFactor + newCompression)
            // ribsFactor = 0.085 - 0.05 = 0.035
            // newCompression = 6 / 100 = 0.06
            // Total factor = 0.035 + 0.06 = 0.095
            // Volume = 20 * 0.095 = 1.9
            const volume = calcVolumeFromArea({
                areaM2: 20,
                hasCofferedSlab: true,
                cofferedSize: '7',
                manualThicknessCm: 6
            });

            expect(volume).toBeCloseTo(1.9, 2);
        });

        it('calculates coffered slab with 10cm compression layer override', () => {
            // 20m² with 7cm cassette, 10cm compression override.
            // ribsFactor = 0.085 - 0.05 = 0.035
            // newCompression = 10 / 100 = 0.10
            // Total factor = 0.135
            // Volume = 20 * 0.135 = 2.7
            const volume = calcVolumeFromArea({
                areaM2: 20,
                hasCofferedSlab: true,
                cofferedSize: '7',
                manualThicknessCm: 10
            });

            expect(volume).toBeCloseTo(2.7, 2);
        });

        it('returns 0 for zero or negative area', () => {
            expect(calcVolumeFromArea({
                areaM2: 0,
                hasCofferedSlab: false,
                cofferedSize: null,
                manualThicknessCm: 10
            })).toBe(0);

            expect(calcVolumeFromArea({
                areaM2: -5,
                hasCofferedSlab: false,
                cofferedSize: null,
                manualThicknessCm: 10
            })).toBe(0);
        });

        it('returns 0 for solid slab with zero thickness', () => {
            expect(calcVolumeFromArea({
                areaM2: 20,
                hasCofferedSlab: false,
                cofferedSize: null,
                manualThicknessCm: 0
            })).toBe(0);
        });
    });

    describe('calcVolumeFromDimensions', () => {

        it('calculates volume from length × width × thickness (with solidSlab factor)', () => {
            // 5m × 4m = 20m², 10cm thick * 0.98 = 20 * 0.1 * 0.98 = 1.96m³
            const volume = calcVolumeFromDimensions({
                lengthM: 5,
                widthM: 4,
                hasCofferedSlab: false,
                cofferedSize: null,
                manualThicknessCm: 10
            });

            expect(volume).toBeCloseTo(1.96, 2);
        });

        it('delegates coffered slab calculation to calcVolumeFromArea', () => {
            // 5m × 4m = 20m², coffered 7cm with 5cm compression
            const volume = calcVolumeFromDimensions({
                lengthM: 5,
                widthM: 4,
                hasCofferedSlab: true,
                cofferedSize: '7',
                manualThicknessCm: undefined
            });

            // Same as calcVolumeFromArea test: 20 * 0.085 = 1.7
            expect(volume).toBeCloseTo(1.7, 1);
        });
    });
});
