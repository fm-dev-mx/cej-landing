// File: lib/schemas/calculator.ts
// Description: Calculator-specific Zod schemas for validating volume and dimensions.

import { z } from "zod";

/**
 * Minimum area threshold (m²) for valid calculator input.
 * Shared with progress.ts to ensure consistency.
 */
export const MIN_AREA_M2 = 10;
export const MAX_AREA_M2 = 20000;
export const MIN_THICKNESS_CM = 1;
export const MAX_THICKNESS_CM = 200;
export const MIN_LENGTH_M = 0.1;
export const MAX_LENGTH_M = 1000;
export const MIN_WIDTH_M = 0.1;
export const MAX_WIDTH_M = 1000;

/**
 * Helper schema to sanitise numeric string inputs and convert to number.
 */
const numericString = z
    .string()
    .transform((val) => Number(val.replace(/,/g, "")))
    .refine((n) => !Number.isNaN(n), { message: "Debe ser un número válido." });

/**
 * Schema factory for known volume (m³) input.
 */
export const createKnownVolumeSchema = () => {
    return z.object({
        m3: numericString.pipe(
            z
                .number()
                .positive("Ingresa un volumen mayor a 0 m³")
                .max(500, "Máximo 500 m³ por pedido web.")
        ),
    });
};

/**
 * Schema for volume calculation based on dimensions.
 * Note: Validation uses meters (m) as base unit, but error messages show centimeters (cm)
 * for user clarity (0.1m = 10cm minimum dimension).
 */
export const DimensionsSchema = z.object({
    length: numericString.pipe(
        z.number().min(MIN_LENGTH_M, "Ingresa un valor válido para el largo").max(MAX_LENGTH_M, "Máximo 1000 m")
    ),
    width: numericString.pipe(
        z.number().min(MIN_WIDTH_M, "Ingresa un valor válido para el ancho").max(MAX_WIDTH_M, "Máximo 1000 m")
    ),
    thickness: numericString.pipe(
        z.number().min(MIN_THICKNESS_CM, "Ingresa un grosor válido (1-200 cm)").max(MAX_THICKNESS_CM, "Máximo 200 cm")
    ),
});

/**
 * Schema for volume calculation based on area.
 */
export const AreaSchema = z.object({
    area: numericString.pipe(
        z.number().min(MIN_AREA_M2, `Ingresa un valor válido para el área (mínimo ${MIN_AREA_M2} m²)`).max(MAX_AREA_M2, "Máximo 20,000 m²")
    ),
    thickness: numericString.pipe(
        z.number().min(MIN_THICKNESS_CM, "Ingresa un grosor válido (1-200 cm)").max(MAX_THICKNESS_CM, "Máximo 200 cm")
    ),
});
