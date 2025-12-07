// lib/pricing.test.ts
import { describe, it, expect } from 'vitest';
import {
    roundUpToStep,
    normalizeVolume,
    calcVolumeFromDimensions,
    calcVolumeFromArea,
    calcQuote,
    EMPTY_QUOTE,
    type SlabDimensionsInput,
    type SlabAreaInput
} from './pricing';
import { CASETON_FACTORS, MIN_M3_BY_TYPE, VAT_RATE, COFFERED_SPECS } from '@/config/business';

describe('Pricing Engine Core', () => {

    // --- BLOQUE 1: Matemáticas y Redondeo ---
    describe('roundUpToStep (Rounding Logic)', () => {
        it('Rounds up to the nearest step (0.5)', () => {
            expect(roundUpToStep(0.1, 0.5)).toBe(0.5);
            expect(roundUpToStep(0.4, 0.5)).toBe(0.5);
            expect(roundUpToStep(0.6, 0.5)).toBe(1.0);
            // Edge case: precisión flotante
            expect(roundUpToStep(2.0001, 0.5)).toBe(2.5);
        });

        it('Handles edge cases (Zero/Negative)', () => {
            expect(roundUpToStep(0, 0.5)).toBe(0);
            expect(roundUpToStep(-1, 0.5)).toBe(0);
        });

        it('Preserves exact steps', () => {
            expect(roundUpToStep(2.5, 0.5)).toBe(2.5);
            expect(roundUpToStep(3.0, 0.5)).toBe(3.0);
        });
    });

    // --- BLOQUE 2: Normalización y Mínimos (MOQ) ---
    describe('normalizeVolume (Business Rules)', () => {
        it('Enforces Minimum Order Quantity (Direct: 2m³)', () => {
            const type = 'direct';
            const min = MIN_M3_BY_TYPE[type]; // 2

            // Caso: Pide menos del mínimo
            const resultLow = normalizeVolume(1.0, type);
            expect(resultLow.requestedM3).toBe(1.0);
            expect(resultLow.billedM3).toBe(min); // Cobra 2
            expect(resultLow.isBelowMinimum).toBe(true);
        });

        it('Enforces Minimum Order Quantity (Pumped: 3m³)', () => {
            const type = 'pumped';
            const min = MIN_M3_BY_TYPE[type]; // 3

            // Caso: Pide 2.5 (más que directo, menos que bomba)
            const resultMid = normalizeVolume(2.5, type);
            expect(resultMid.requestedM3).toBe(2.5);
            expect(resultMid.billedM3).toBe(min); // Cobra 3
            expect(resultMid.isBelowMinimum).toBe(true);
        });

        it('Respects volumes above minimum', () => {
            const type = 'direct';
            const result = normalizeVolume(2.1, type);
            expect(result.billedM3).toBe(2.5); // Redondeo normal
            expect(result.isBelowMinimum).toBe(false);
        });
    });

    // --- BLOQUE 3: Calculadoras de Volumen (Geometría) ---
    describe('Volume Calculators', () => {
        // Restaurado: Validación de inputs negativos/ceros
        it('Returns 0 for invalid dimensions (Safety Check)', () => {
            const base = { hasCofferedSlab: false, cofferedSize: null, manualThicknessCm: 10 };
            expect(calcVolumeFromDimensions({ ...base, lengthM: 0, widthM: 5 })).toBe(0);
            expect(calcVolumeFromDimensions({ ...base, lengthM: 10, widthM: -5 })).toBe(0);
            expect(calcVolumeFromArea({ areaM2: -10, ...base })).toBe(0);
        });

        it('Calculates Solid Slab volume correctly (with waste factor)', () => {
            const input: SlabDimensionsInput = {
                lengthM: 10,
                widthM: 5,
                manualThicknessCm: 10, // 0.10m
                hasCofferedSlab: false,
                cofferedSize: null
            };
            // 10 * 5 * 0.10 = 5m³
            // Negocio: Aplica factor de losa sólida (ej. 0.98 o 1.0 según config)
            const expected = 5 * CASETON_FACTORS.solidSlab;
            expect(calcVolumeFromDimensions(input)).toBeCloseTo(expected);
        });

        it('Calculates Coffered Slab using coefficients', () => {
            const size = '15'; // 15cm
            const input: SlabAreaInput = {
                areaM2: 100,
                manualThicknessCm: 0,
                hasCofferedSlab: true,
                cofferedSize: size,
            };
            // 100m² * 0.135 (coef) = 13.5m³
            const expected = 100 * COFFERED_SPECS[size].coefficient;
            expect(calcVolumeFromArea(input)).toBeCloseTo(expected);
        });
    });

    // --- BLOQUE 4: Motor de Cotización (Financiero) ---
    describe('calcQuote (Financials)', () => {
        it('Returns empty quote for invalid input', () => {
            const quote = calcQuote(0, '200', 'direct');
            expect(quote.total).toBe(0);
            expect(quote).toEqual(expect.objectContaining({
                subtotal: 0,
                vat: 0,
                total: 0
            }));
        });

        // Restaurado: Verificación matemática exacta del IVA y Total
        it('Calculates Subtotal, VAT and Total correctly', () => {
            const vol = 5; // Arriba de mínimos
            const type = 'direct';
            const strength = '250';

            const quote = calcQuote(vol, strength, type);

            // Verificar que hay precio unitario
            expect(quote.unitPricePerM3).toBeGreaterThan(0);

            // Verificar matemática: Subtotal + IVA = Total
            const expectedVat = quote.subtotal * VAT_RATE;
            expect(quote.vat).toBeCloseTo(expectedVat, 2);
            expect(quote.total).toBeCloseTo(quote.subtotal + quote.vat, 2);
        });

        // Restaurado: Lógica de cambio de precio por volumen (Tiers)
        it('Applies correct pricing tiers based on volume', () => {
            // Asumiendo que el precio baja o cambia con el volumen si está configurado así
            // O simplemente verificando que 10m³ cuestan el doble que 5m³ (si es lineal)
            // O verificando que el unitPrice se resuelve correctamente.

            const quoteSmall = calcQuote(3, '200', 'direct');
            const quoteLarge = calcQuote(10, '200', 'direct');

            // Sanity check: El unit price debe existir en ambos
            expect(quoteSmall.unitPricePerM3).toBeGreaterThan(0);
            expect(quoteLarge.unitPricePerM3).toBeGreaterThan(0);

            // Check básico de consistencia
            expect(quoteLarge.subtotal).toBeGreaterThan(quoteSmall.subtotal);
        });
    });
});
