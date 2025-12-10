// File: lib/schemas/orders.ts
// Description: Zod schemas for order and lead submission payloads.

import { z } from "zod";

export const CustomerSchema = z.object({
    name: z.string().min(3, "El nombre es muy corto"),
    phone: z.string().min(10, "Verifica el número (10 dígitos)"),
    visitorId: z.string().optional(),
    email: z.string().email().optional(),
});

// Flexible item schema for JSONB column in DB
const OrderItemSchema = z.object({
    id: z.string(),
    label: z.string(),
    volume: z.number(),
    service: z.string(),
    subtotal: z.number(),
    // Add additives to schema to prevent Zod from stripping them during validation
    additives: z.array(z.string()).optional(),
});

export const OrderSubmissionSchema = z.object({
    // Top level contact info (mapped to DB columns)
    name: z.string().min(3, "El nombre es muy corto"),
    phone: z.string().min(10, "Verifica el número (10 dígitos)"),

    // Rich quote payload, stored as JSONB snapshot
    quote: z.object({
        folio: z.string(),
        items: z.array(OrderItemSchema),
        financials: z.object({
            total: z.number(),
            currency: z.string(),
        }),
        // Metadata is now strict instead of z.any()
        metadata: z.object({
            source: z.literal("web_calculator"),
            pricing_version: z.number().optional(),
            utm_source: z.string().optional(),
            utm_medium: z.string().optional(),
            userAgent: z.string().optional(),
        }),
        // Enforce strict customer schema matching OrderPayload
        customer: CustomerSchema,
    }),

    // Tracking & privacy metadata
    visitor_id: z.string().optional(),
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    privacy_accepted: z.literal(true, {
        errorMap: () => ({ message: "Debes aceptar el aviso de privacidad" }),
    }),
    fb_event_id: z.string().optional(),
});

export type OrderSubmission = z.infer<typeof OrderSubmissionSchema>;
