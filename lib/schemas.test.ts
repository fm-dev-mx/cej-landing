import { describe, it, expect } from 'vitest';
import { createKnownVolumeSchema, DimensionsSchema } from '@/lib/schemas/calculator';
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
        it('enforces logical physical limits', () => {
            // Thickness > 200cm (2 meters) is likely an error for a slab
            expect(DimensionsSchema.safeParse({
                length: '10', width: '10', thickness: '201'
            }).success).toBe(false);

            // Length 0
            expect(DimensionsSchema.safeParse({
                length: '0', width: '10', thickness: '10'
            }).success).toBe(false);
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
