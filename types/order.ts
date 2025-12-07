import { type CalculatorState, type QuoteBreakdown } from "@/components/Calculator/types";

/**
 * Represents a single item in the shopping cart.
 * Persisted in localStorage via Zustand.
 */
export type CartItem = {
    id: string;
    timestamp: number;
    inputs: CalculatorState; // Full state snapshot for editing/cloning
    results: QuoteBreakdown; // Calculated prices and volumes
    config: {
        label: string; // Human readable label (e.g. "Losa - f'c 200")
    };
};

/**
 * Customer information for the order.
 */
export type CustomerInfo = {
    name: string;
    phone: string;
    visitorId?: string;
    email?: string;
};

/**
 * Full payload sent to the server (Supabase).
 * Stored in the 'quote_data' JSONB column.
 */
export type OrderPayload = {
    folio: string; // Generated ID (e.g. WEB-20231025-1234)
    customer: CustomerInfo;
    items: {
        id: string;
        label: string;
        volume: number;
        service: string;
        subtotal: number;
    }[];
    financials: {
        total: number;
        currency: string;
    };
    metadata: {
        source: 'web_calculator';
        utm_source?: string;
        utm_medium?: string;
        userAgent?: string;
        landingPage?: string;
    };
};
