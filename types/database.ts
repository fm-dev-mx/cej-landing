// types/database.ts

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

/**
 * Snapshot inmutable de la cotización al momento de la creación.
 * Debe coincidir con la estructura de salida de lib/schemas.ts
 *
 * IMPORTANT: This snapshot captures the exact state at submission time
 * to ensure the shared quote page renders identically to what the user saw.
 */
export interface QuoteSnapshot {
    folio: string;
    customer?: {
        name: string;
        phone: string;
        email?: string;
        visitorId?: string;
    };
    /** Cart items for OMS/billing purposes */
    items: Array<{
        id: string;
        label: string;
        volume: number;
        service: string;
        subtotal: number;
    }>;
    /** Complete financial breakdown for accurate display */
    financials: {
        subtotal: number;
        vat: number;
        total: number;
        currency: string;
    };
    /** Display-ready line items matching TicketDisplay format */
    breakdownLines?: Array<{
        label: string;
        value: number;
        type: 'base' | 'additive' | 'surcharge';
    }>;
    metadata?: Record<string, unknown>;
}

export interface Database {
    public: {
        Tables: {
            leads: {
                Row: {
                    id: number; // bigint se convierte a number en JS (o string si es muy grande, pero supabase lo maneja)
                    created_at: string;
                    name: string;
                    phone: string;
                    status: string;
                    quote_data: QuoteSnapshot; // JSONB fuertemente tipado
                    visitor_id: string | null;
                    fb_event_id: string | null;
                    utm_source: string | null;
                    utm_medium: string | null;
                    utm_campaign: string | null;
                    utm_term: string | null;
                    utm_content: string | null;
                    fbclid: string | null;
                    delivery_date: string | null;
                    delivery_address: string | null;
                    notes: string | null;
                    lost_reason: string | null;
                    privacy_accepted: boolean | null;
                    privacy_accepted_at: string | null;
                };
                Insert: {
                    id?: number;
                    created_at?: string;
                    name: string;
                    phone: string;
                    status?: string;
                    quote_data: QuoteSnapshot;
                    visitor_id?: string | null;
                    fb_event_id?: string | null;
                    utm_source?: string | null;
                    utm_medium?: string | null;
                    utm_campaign?: string | null;
                    utm_term?: string | null;
                    utm_content?: string | null;
                    fbclid?: string | null;
                    delivery_date?: string | null;
                    delivery_address?: string | null;
                    notes?: string | null;
                    lost_reason?: string | null;
                    privacy_accepted?: boolean | null;
                    privacy_accepted_at?: string | null;
                };
                Update: Partial<Database['public']['Tables']['leads']['Insert']>;
                // CRÍTICO: Esto soluciona el error "Argument of type ... is not assignable to parameter of type 'never'"
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}
