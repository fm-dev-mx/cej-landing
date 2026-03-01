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

export interface InternalOrderItemSnapshot {
    id: string;
    label: string;
    volume: number;
    service: 'direct' | 'pumped';
    subtotal: number;
    strength: string;
    notes?: string;
}

export interface Database {
    public: {
        Tables: {
            orders: {
                Row: {
                    id: string;
                    user_id: string;
                    folio: string;
                    status: string;
                    total_amount: number;
                    currency: string;
                    items: InternalOrderItemSnapshot[];
                    delivery_date: string | null;
                    delivery_address: string | null;
                    geo_location: Json | null;
                    created_at: string;
                    updated_at: string;
                    utm_source?: string | null;
                    utm_medium?: string | null;
                    utm_campaign?: string | null;
                    utm_term?: string | null;
                    utm_content?: string | null;
                    fbclid?: string | null;
                    gclid?: string | null;
                    lead_id?: number | null;
                    pricing_version?: number | null;
                    price_breakdown?: Json | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    folio: string;
                    status?: string;
                    total_amount: number;
                    currency?: string;
                    items: InternalOrderItemSnapshot[];
                    delivery_date?: string | null;
                    delivery_address?: string | null;
                    geo_location?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                    utm_source?: string | null;
                    utm_medium?: string | null;
                    utm_campaign?: string | null;
                    utm_term?: string | null;
                    utm_content?: string | null;
                    fbclid?: string | null;
                    gclid?: string | null;
                    lead_id?: number | null;
                    pricing_version?: number | null;
                    price_breakdown?: Json | null;
                };
                Update: Partial<Database['public']['Tables']['orders']['Insert']>;
                Relationships: [];
            };
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
                    gclid: string | null;
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
                    gclid?: string | null;
                };
                Update: Partial<Database['public']['Tables']['leads']['Insert']>;
                Relationships: [];
            };
            price_config: {
                Row: {
                    id: number;
                    version: number;
                    pricing_rules: Json;
                    active: boolean | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: number;
                    version?: number;
                    pricing_rules: Json;
                    active?: boolean | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database['public']['Tables']['price_config']['Insert']>;
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
