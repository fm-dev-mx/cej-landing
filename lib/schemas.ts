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

// --- Lead & Checkout Schemas ---

export const LeadSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),

    // Flexible quote object to handle single quote OR cart payload
    quote: z.object({
        // Single mode props
        summary: z.any().optional(),
        context: z.any().optional(),

        // Cart mode props
        items: z.array(z.any()).optional(),
        total: z.number().optional(),
    }),

    // Identity & Tracking
    visitor_id: z.string().nullable().optional(),
    session_id: z.string().nullable().optional(),
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().nullable().optional(),
    utm_term: z.string().nullable().optional(),
    utm_content: z.string().nullable().optional(),
    fbclid: z.string().nullable().optional(),
    fb_event_id: z.string().optional(),

    privacy_accepted: z.literal(true, {
        errorMap: () => ({ message: "Debes aceptar el aviso de privacidad" })
    }),
});

export type LeadData = z.infer<typeof LeadSchema>;
