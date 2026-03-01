// types/database.ts

import type { PricingRules } from '@/lib/schemas/pricing';
import type {
    ConcreteType,
    QuoteLineItem,
    PricingSnapshot
} from './quote';

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

/**
 * Shared service type derived from domain
 */
export type ServiceType = ConcreteType;

/**
 * Structured geospatial data
 */
export interface GeoLocation {
    lat: number;
    lng: number;
}

/**
 * Snapshot inmutable de la cotización al momento de la creación.
 * Debe coincidir con la estructura de salida de lib/schemas.ts
 *
 * IMPORTANT: This snapshot captures the exact state at submission time
 * to ensure the shared quote page renders identically to what the user saw.
 */
export type QuoteSnapshot = {
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
        service: ServiceType;
        subtotal: number;
        additives?: string[];
    }>;
    /** Complete financial breakdown for accurate display */
    financials: {
        subtotal: number;
        vat: number;
        total: number;
        currency: string;
    };
    /** Display-ready line items matching TicketDisplay format */
    breakdownLines?: QuoteLineItem[];
    metadata?: Record<string, unknown>;
};

export interface InternalOrderItemSnapshot {
    id: string;
    label: string;
    volume: number;
    service: ServiceType;
    subtotal: number;
    strength: string;
    additives?: string[];
    notes?: string;
}

/**
 * Base database fields common across entities
 */

export interface TimestampFields {
    created_at: string;
    updated_at: string;
}

export interface AttributionFields {
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_term: string | null;
    utm_content: string | null;
    fbclid: string | null;
    gclid: string | null;
}

export interface DeliveryFields {
    delivery_date: string | null;
    delivery_address: string | null;
}

export interface DatabaseRowOrders extends TimestampFields, AttributionFields, DeliveryFields {
    id: string;
    user_id: string;
    folio: string;
    status: string;
    total_amount: number;
    currency: string;
    items: InternalOrderItemSnapshot[];
    geo_location: GeoLocation | null;
    lead_id: number | null;
    pricing_version: number | null;
    price_breakdown: PricingSnapshot | null;
}

export interface DatabaseRowLeads extends AttributionFields, DeliveryFields {
    id: number; // Note: bigint in Postgres. Safe up to 2^53-1 in JS number.
    created_at: string;
    name: string;
    phone: string;
    status: string;
    phone_norm: string;
    quote_data: QuoteSnapshot | Json;
    visitor_id: string | null;
    fb_event_id: string | null;
    notes: string | null;
    lost_reason: string | null;
    privacy_accepted: boolean | null;
    privacy_accepted_at: string | null;
}

export interface DatabaseRowPriceConfig extends TimestampFields {
    id: number;
    version: number;
    pricing_rules: PricingRules;
    active: boolean | null;
}

export interface Database {
    public: {
        Tables: {
            orders: {
                Row: DatabaseRowOrders;
                Insert: {
                    id?: string;
                    user_id: string;
                    folio: string;
                    status?: string;
                    total_amount: number;
                    currency?: string;
                    items: InternalOrderItemSnapshot[];
                    geo_location?: GeoLocation | null;
                    created_at?: string;
                    updated_at?: string;
                    lead_id?: number | null;
                    pricing_version?: number | null;
                    price_breakdown?: PricingSnapshot | null;
                } & Partial<AttributionFields> & Partial<DeliveryFields>;
                Update: Partial<Database['public']['Tables']['orders']['Insert']>;
                Relationships: [];
            };
            leads: {
                Row: DatabaseRowLeads;
                Insert: {
                    id?: number;
                    created_at?: string;
                    name: string;
                    phone: string;
                    phone_norm: string;
                    status?: string;
                    quote_data: QuoteSnapshot;
                    visitor_id?: string | null;
                    fb_event_id?: string | null;
                    notes?: string | null;
                    lost_reason?: string | null;
                    privacy_accepted?: boolean | null;
                    privacy_accepted_at?: string | null;
                } & Partial<AttributionFields> & Partial<DeliveryFields>;
                Update: Partial<Database['public']['Tables']['leads']['Insert']>;
                Relationships: [];
            };
            price_config: {
                Row: DatabaseRowPriceConfig;
                Insert: {
                    id?: number;
                    version?: number;
                    pricing_rules: PricingRules;
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
