// lib/pricing.test.ts
import { describe, it, expect } from 'vitest';
import {
    calcQuote,
    DEFAULT_PRICING_RULES,
    EMPTY_QUOTE
} from './pricing';
import { CalculatorState } from '@/types/domain';

describe('Pricing Engine (Phase 2: Expert Engine)', () => {

    // Dummy inputs base
    const baseInput: Pick<CalculatorState, 'strength' | 'type' | 'additives'> = {
        strength: '200',
        type: 'direct',
        additives: []
    };

    it('Calculates identical result to static version when no additives are used', () => {
        const quote = calcQuote(5, baseInput, DEFAULT_PRICING_RULES);

        expect(quote.unitPricePerM3).toBeGreaterThan(0);
        expect(quote.additivesSubtotal).toBe(0);
        expect(quote.baseSubtotal).toEqual(quote.subtotal);
    });

    it('Adds "per_m3" additives correctly', () => {
        // Setup: Add "fiber" which is 150 MXN (15000 cents) per m3 in default rules
        const input = { ...baseInput, additives: ['fiber'] };
        const volume = 2; // 2m3
        const quote = calcQuote(volume, input, DEFAULT_PRICING_RULES);

        const expectedAdditiveCost = 150 * volume; // $300
        expect(quote.additivesSubtotal).toBe(expectedAdditiveCost);
        expect(quote.subtotal).toBe(quote.baseSubtotal + expectedAdditiveCost);

        // Verify line items
        const fiberLine = quote.breakdownLines.find(l => l.type === 'additive');
        expect(fiberLine).toBeDefined();
        expect(fiberLine?.value).toBe(expectedAdditiveCost);
    });

    it('Adds "fixed" additives correctly (mock custom rule)', () => {
        // Mock Rule with a fixed cost item
        const mockRules = {
            ...DEFAULT_PRICING_RULES,
            additives: [
                {
                    id: 'flete_extra',
                    label: 'Flete Lejano',
                    priceCents: 50000, // $500
                    pricingModel: 'fixed_per_load' as const,
                    active: true
                }
            ]
        };

        const input = { ...baseInput, additives: ['flete_extra'] };
        const volume = 10; // High volume
        const quote = calcQuote(volume, input, mockRules);

        expect(quote.additivesSubtotal).toBe(500); // Should be 500 regardless of volume
    });

    it('Ignores invalid or inactive additives IDs gracefully', () => {
        const input = { ...baseInput, additives: ['invalid_id', 'fiber'] };
        const quote = calcQuote(2, input, DEFAULT_PRICING_RULES);

        // Should only charge for fiber
        const expectedAdditiveCost = 150 * 2;
        expect(quote.additivesSubtotal).toBe(expectedAdditiveCost);
        // Should NOT crash
    });

    it('Calculates VAT on top of Total (Base + Additives)', () => {
        const input = { ...baseInput, additives: ['fiber'] };
        const quote = calcQuote(2, input, DEFAULT_PRICING_RULES);

        const taxableBase = quote.subtotal;
        const expectedVat = taxableBase * DEFAULT_PRICING_RULES.vatRate;

        expect(quote.vat).toBeCloseTo(expectedVat);
        expect(quote.total).toBeCloseTo(taxableBase + expectedVat);
    });
});
