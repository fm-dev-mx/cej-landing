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
    additives: z.array(z.string()).optional(),
});

/**
 * Schema representing the full quote/order snapshot.
 * Aligned strictly with OrderPayload interface in types/domain.ts
 */
export const OrderPayloadSchema = z.object({
    folio: z.string(),
    customer: CustomerSchema,
    items: z.array(OrderItemSchema),
    financials: z.object({
        subtotal: z.number(),
        vat: z.number(),
        total: z.number(),
        currency: z.string(),
    }),
    breakdownLines: z.array(z.object({
        label: z.string(),
        value: z.number(),
        type: z.enum(['base', 'additive', 'surcharge']),
    })).optional(),
    metadata: z.object({
        source: z.literal("web_calculator"),
        pricing_version: z.number().optional(),
        utm_source: z.string().optional(),
        utm_medium: z.string().optional(),
        userAgent: z.string().optional(),
        deliveryAddress: z.string().optional(),
        deliveryDate: z.string().optional(),
        deliveryTime: z.string().optional(),
        notes: z.string().optional(),
    }),
});

export const OrderSubmissionSchema = z.object({
    // Top level contact info (mapped to DB columns)
    name: z.string().min(3, "El nombre es muy corto"),
    phone: z.string().min(10, "Verifica el número (10 dígitos)"),

    // Rich quote payload, stored as JSONB snapshot
    quote: OrderPayloadSchema,

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

/**
 * Validates a folio string from a URL parameter.
 * Format: WEB-YYYYMMDD-XXXX (where XXXX is numeric, matching generateQuoteId output)
 */
export const FolioParamSchema = z.string().regex(/^WEB-\d{8}-\d{4}$/, "Formato de folio inválido");
