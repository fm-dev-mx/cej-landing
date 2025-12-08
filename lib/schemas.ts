// lib/schemas.ts
import { z } from 'zod';

/**
 * Helper to sanitise numeric inputs
 */
const numericString = z
    .string()
    .transform((val) => Number(val.replace(/,/g, '')))
    .refine((n) => !Number.isNaN(n), { message: 'Debe ser un número válido.' });

// --- Calculator Schemas ---

export const createKnownVolumeSchema = () => {
    return z.object({
        m3: numericString.pipe(
            z.number().positive().max(500, 'Máximo 500 m³ por pedido web.')
        ),
    });
};

export const DimensionsSchema = z.object({
    length: numericString.pipe(z.number().min(0.1).max(1000)),
    width: numericString.pipe(z.number().min(0.1).max(1000)),
    thickness: numericString.pipe(z.number().min(1).max(200)),
});

export const AreaSchema = z.object({
    area: numericString.pipe(z.number().min(1).max(20000)),
    thickness: numericString.pipe(z.number().min(1).max(200)),
});

// --- Lead & Order Schemas ---

export const CustomerSchema = z.object({
    name: z.string().min(3, "El nombre es muy corto"),
    phone: z.string().min(10, "Verifica el número (10 dígitos)"),
    visitorId: z.string().optional(),
    email: z.string().email().optional(),
});

// Flexible item schema for the JSONB column
const OrderItemSchema = z.object({
    id: z.string(),
    label: z.string(),
    volume: z.number(),
    service: z.string(),
    subtotal: z.number(),
});

export const OrderSubmissionSchema = z.object({
    // Top level contact info (mapped to columns)
    name: z.string(),
    phone: z.string(),

    // The rich data payload (mapped to jsonb)
    quote: z.object({
        folio: z.string(),
        items: z.array(OrderItemSchema),
        financials: z.object({
            total: z.number(),
            currency: z.string(),
        }),
        metadata: z.any().optional(),
        customer: CustomerSchema.optional(),
    }),

    // Tracking & Privacy
    visitor_id: z.string().optional(),
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    privacy_accepted: z.literal(true, {
        errorMap: () => ({ message: "Debes aceptar el aviso de privacidad" })
    }),
    fb_event_id: z.string().optional(),
});

export type OrderSubmission = z.infer<typeof OrderSubmissionSchema>;
