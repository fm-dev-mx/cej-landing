// File: lib/schemas/calculator.ts
// Description: Calculator-specific Zod schemas for validating volume and dimensions.

import { z } from "zod";

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
        z.number().min(0.1, "Mínimo 10 cm").max(1000, "Máximo 1000 m")
    ),
    width: numericString.pipe(
        z.number().min(0.1, "Mínimo 10 cm").max(1000, "Máximo 1000 m")
    ),
    thickness: numericString.pipe(
        z.number().min(1, "Ingresa un grosor válido (1-200 cm)").max(200, "Máximo 200 cm")
    ),
});

/**
 * Schema for volume calculation based on area.
 */
export const AreaSchema = z.object({
    area: numericString.pipe(
        z.number().min(1, "Ingresa un área mayor a 0 m²").max(20000, "Máximo 20,000 m²")
    ),
    thickness: numericString.pipe(
        z.number().min(1, "Ingresa un grosor válido (1-200 cm)").max(200, "Máximo 200 cm")
    ),
});
