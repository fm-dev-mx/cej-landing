// lib/pricing.test.ts
import { describe, it, expect } from 'vitest';
import { calcQuote, normalizeVolume, roundUpToStep, toPesos } from '@/lib/pricing';
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
    } as any
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
