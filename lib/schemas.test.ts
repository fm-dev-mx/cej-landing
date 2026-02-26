import { describe, it, expect } from 'vitest';
import {
    createKnownVolumeSchema,
    DimensionsSchema,
    AreaSchema,
    MIN_AREA_M2,
    MIN_LENGTH_M,
    MAX_LENGTH_M,
    MIN_WIDTH_M,
    MAX_WIDTH_M,
    MIN_THICKNESS_CM,
    MAX_THICKNESS_CM
} from '@/lib/schemas/calculator';
import { PricingRulesSchema } from '@/lib/schemas/pricing';

describe('Validation Schemas (Security & Data Integrity)', () => {

    describe('createKnownVolumeSchema', () => {
        const schema = createKnownVolumeSchema();

        it('allows valid positive numbers', () => {
            expect(schema.safeParse({ m3: '5.5' }).success).toBe(true);
            expect(schema.safeParse({ m3: '500' }).success).toBe(true);
        });

        it('rejects values exceeding max limit (Security)', () => {
            const result = schema.safeParse({ m3: '501' });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toMatch(/Máximo/i);
            }
        });

        it('sanitizes input with commas (treats as thousands separator)', () => {
            // Caso: "1,200" se sanitiza a 1200.
            const result = schema.safeParse({ m3: '1,200' });
            // 1,200 > 500, so it parses to number 1200 then fails max check
            // This proves the transform works, even if validation fails
            expect(result.success).toBe(false);

            const valid = schema.safeParse({ m3: '1,5' }); // 1.5 logic? No, JS replace removes comma -> 15
            // '1,5' -> '15'
            expect(valid.success).toBe(true);
            expect(valid.data?.m3).toBe(15);
        });

        it('rejects malicious non-numeric injection', () => {
            expect(schema.safeParse({ m3: '1 OR 1=1' }).success).toBe(false);
            expect(schema.safeParse({ m3: '<script>' }).success).toBe(false);
        });
    });

    describe('DimensionsSchema', () => {
        // --- Valid minimum thresholds ---
        it('allows valid dimensions at minimum thresholds', () => {
            const result = DimensionsSchema.safeParse({
                length: String(MIN_LENGTH_M),
                width: String(MIN_WIDTH_M),
                thickness: String(MIN_THICKNESS_CM)
            });
            expect(result.success).toBe(true);
        });

        it('allows valid dimensions above minimum', () => {
            const result = DimensionsSchema.safeParse({
                length: '10', width: '10', thickness: '10'
            });
            expect(result.success).toBe(true);
        });

        // --- Maximum limits ---
        it('allows dimensions at maximum limits', () => {
            const result = DimensionsSchema.safeParse({
                length: String(MAX_LENGTH_M),
                width: String(MAX_WIDTH_M),
                thickness: String(MAX_THICKNESS_CM)
            });
            expect(result.success).toBe(true);
        });

        // --- Length validation ---
        it('rejects length below minimum', () => {
            const result = DimensionsSchema.safeParse({
                length: '0.05', width: '10', thickness: '10'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toMatch(/largo/i);
            }
        });

        it('rejects length above maximum', () => {
            const result = DimensionsSchema.safeParse({
                length: '1001', width: '10', thickness: '10'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toMatch(/Máximo/i);
            }
        });

        // --- Width validation ---
        it('rejects width below minimum', () => {
            const result = DimensionsSchema.safeParse({
                length: '10', width: '0.05', thickness: '10'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toMatch(/ancho/i);
            }
        });

        it('rejects width above maximum', () => {
            const result = DimensionsSchema.safeParse({
                length: '10', width: '1001', thickness: '10'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toMatch(/Máximo/i);
            }
        });

        // --- Thickness validation ---
        it('rejects thickness below minimum', () => {
            const result = DimensionsSchema.safeParse({
                length: '10', width: '10', thickness: '0'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toMatch(/grosor/i);
            }
        });

        it('rejects thickness above maximum (> 200cm)', () => {
            const result = DimensionsSchema.safeParse({
                length: '10', width: '10', thickness: '201'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toMatch(/Máximo/i);
            }
        });

        // --- Zero/invalid input ---
        it('rejects zero values for length', () => {
            const result = DimensionsSchema.safeParse({
                length: '0', width: '10', thickness: '10'
            });
            expect(result.success).toBe(false);
        });
    });

    describe('AreaSchema', () => {
        it('allows valid area at minimum threshold', () => {
            const result = AreaSchema.safeParse({ area: '10', thickness: '10' });
            expect(result.success).toBe(true);
        });

        it('allows valid area above minimum', () => {
            const result = AreaSchema.safeParse({ area: '50', thickness: '15' });
            expect(result.success).toBe(true);
        });

        it(`rejects area below MIN_AREA_M2 (${MIN_AREA_M2}m²)`, () => {
            const result = AreaSchema.safeParse({ area: '9', thickness: '10' });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toMatch(/mínimo/i);
            }
        });

        it('rejects area exceeding max limit', () => {
            const result = AreaSchema.safeParse({ area: '20001', thickness: '10' });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toMatch(/Máximo/i);
            }
        });
    });

    describe('PricingRulesSchema (Configuration Integrity)', () => {
        it('validates a correct pricing rule structure', () => {
            const validRule = {
                version: 1,
                lastUpdated: new Date().toISOString(),
                vatRate: 0.16,
                currency: 'MXN',
                minOrderQuantity: { direct: 1, pumped: 3 },
                additives: [],
                base: {
                    direct: {
                        '200': [{ minM3: 0, pricePerM3Cents: 100 }]
                    },
                    pumped: {}
                }
            };
            const result = PricingRulesSchema.safeParse(validRule);
            expect(result.success).toBe(true);
        });

        it('rejects negative prices', () => {
            const invalidRule = {
                // ... partial structure
                minOrderQuantity: { direct: 1, pumped: 3 },
                base: {
                    direct: {
                        '200': [{ minM3: 0, pricePerM3Cents: -100 }]
                    }
                }
            };
            const result = PricingRulesSchema.safeParse(invalidRule);
            expect(result.success).toBe(false);
        });
    });
});
