// lib/schemas.test.ts
import { describe, it, expect } from 'vitest';
import { createKnownVolumeSchema, DimensionsSchema, AreaSchema } from './schemas';

describe('Zod Schemas Validation', () => {

    describe('createKnownVolumeSchema', () => {
        const schema = createKnownVolumeSchema();

        it('accepts valid volumes', () => {
            const result = schema.safeParse({ m3: '5' });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.m3).toBe(5);
            }
        });

        it('rejects negative numbers', () => {
            const result = schema.safeParse({ m3: '-1' });
            expect(result.success).toBe(false);
        });

        it('rejects zero', () => {
            const result = schema.safeParse({ m3: '0' });
            expect(result.success).toBe(false);
        });

        it('rejects non-numeric strings', () => {
            const result = schema.safeParse({ m3: 'abc' });
            expect(result.success).toBe(false);
        });

        it('handles max volume limit', () => {
            const result = schema.safeParse({ m3: '1000' }); // Limit is 500 in schema
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('máximo');
            }
        });
    });

    describe('DimensionsSchema', () => {
        it('parses valid dimensions', () => {
            const result = DimensionsSchema.safeParse({
                length: '10',
                width: '5',
                thickness: '15'
            });
            expect(result.success).toBe(true);
        });

        it('transforms comma inputs correctly', () => {
            const result = DimensionsSchema.safeParse({
                length: '10,5',
                width: '5',
                thickness: '10'
            });
            expect(result.success).toBe(true);
            if (result.success) {
                // The schema implementation replaces ',' with empty string for thousands separators.
                expect(result.data.length).toBe(105);
            }
        });

        it('validates min dimensions (0)', () => {
            const result = DimensionsSchema.safeParse({
                length: '0',
                width: '5',
                thickness: '10'
            });
            expect(result.success).toBe(false);
        });

        // NEW: Verify max dimension limits
        it('validates max dimensions (1000m)', () => {
            const result = DimensionsSchema.safeParse({
                length: '1001',
                width: '5',
                thickness: '10'
            });
            expect(result.success).toBe(false);
        });

        // NEW: Verify thickness limits (1cm - 200cm)
        it('validates thickness range', () => {
            // Too thin (< 1cm)
            const thin = DimensionsSchema.safeParse({ length: '10', width: '5', thickness: '0.5' });
            expect(thin.success).toBe(false);

            // Too thick (> 200cm)
            const thick = DimensionsSchema.safeParse({ length: '10', width: '5', thickness: '201' });
            expect(thick.success).toBe(false);
        });
    });

    describe('AreaSchema', () => {
        it('parses valid area', () => {
            const result = AreaSchema.safeParse({
                area: '50',
                thickness: '10'
            });
            expect(result.success).toBe(true);
        });

        // NEW: Verify area limits
        it('validates area range', () => {
            // Zero area
            const zero = AreaSchema.safeParse({ area: '0', thickness: '10' });
            expect(zero.success).toBe(false);

            // Max area (20,000)
            const huge = AreaSchema.safeParse({ area: '20001', thickness: '10' });
            expect(huge.success).toBe(false);
        });
    });
});
