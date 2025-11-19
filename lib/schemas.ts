// lib/schemas.ts

import { z } from 'zod';

/**
 * Converts string input to number.
 * Handles empty and non-numeric strings by returning NaN or 0 so Zod can validate ranges.
 */
const numericString = z
    .string()
    .transform((val) => Number(val.replace(/,/g, '')))
    .refine((n) => !Number.isNaN(n), { message: 'Debe ser un número válido.' });

// --- Schemas by Mode ---

export const createKnownVolumeSchema = () => {
    return z.object({
        m3: numericString.pipe(
            z
                .number()
                .positive({ message: 'El volumen debe ser mayor a 0.' })
                // Note: We allow values below the business minimum to show a Warning instead of an Error,
                // but we block 0 or negative numbers.
                .max(500, { message: 'El volumen máximo por pedido web es de 500 m³.' })
        ),
    });
};

export const DimensionsSchema = z.object({
    length: numericString.pipe(
        z.number().min(0.1, { message: 'El largo es requerido.' }).max(1000)
    ),
    width: numericString.pipe(
        z.number().min(0.1, { message: 'El ancho es requerido.' }).max(1000)
    ),
    thickness: numericString.pipe(
        z
            .number()
            .min(1, { message: 'El grosor mínimo es 1 cm.' })
            .max(200, { message: 'Verifica el grosor (máx 200 cm).' })
    ),
});

export const AreaSchema = z.object({
    area: numericString.pipe(
        z.number().min(1, { message: 'El área es requerida.' }).max(20000)
    ),
    thickness: numericString.pipe(
        z
            .number()
            .min(1, { message: 'El grosor mínimo es 1 cm.' })
            .max(200, { message: 'Verifica el grosor (máx 200 cm).' })
    ),
});
