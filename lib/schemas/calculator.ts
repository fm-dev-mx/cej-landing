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
 */
export const DimensionsSchema = z.object({
    length: numericString.pipe(
        z.number().min(0.1, "El valor debe ser al menos 0.1 m").max(1000)
    ),
    width: numericString.pipe(
        z.number().min(0.1, "El valor debe ser al menos 0.1 m").max(1000)
    ),
    thickness: numericString.pipe(z.number().min(1).max(200)),
});

/**
 * Schema for volume calculation based on area.
 */
export const AreaSchema = z.object({
    area: numericString.pipe(z.number().min(1).max(20000)),
    thickness: numericString.pipe(z.number().min(1).max(200)),
});
