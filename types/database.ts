import type { PricingRules } from '@/lib/schemas/pricing';
import type { ConcreteType, QuoteLineItem, PricingSnapshot } from './quote';
import type { DbOrderStatus, DbPaymentStatus, DbFiscalStatus, DbPaymentDirection, DbPaymentKind, DbPaymentMethod } from './database-enums';

export type { DbOrderStatus, DbPaymentStatus, DbFiscalStatus, DbPaymentDirection, DbPaymentKind, DbPaymentMethod };

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type ServiceType = ConcreteType;

export interface GeoLocation {
    lat: number;
    lng: number;
}

export type QuoteSnapshot = {
    folio: string;
    customer?: {
        name: string;
        phone: string;
        email?: string;
        visitorId?: string;
    };
    items: Array<{
        id: string;
        label: string;
        volume: number;
        service: ServiceType;
        subtotal: number;
        additives?: string[];
    }>;
    financials: {
        subtotal: number;
        vat: number;
        total: number;
        currency: string;
    };
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

export interface PaymentsSummaryJson {
    paid_amount: number;
    balance_amount: number;
    last_paid_at: string | null;
}

export interface PricingSnapshotJson {
    version: number;
    computed_at: string;
    inputs: {
        volume: number;
        concreteType: 'direct' | 'pumped';
        strength: string;
    };
    breakdown: unknown;
}

export interface DatabaseRowOrders extends TimestampFields, AttributionFields, DeliveryFields {
    id: string;
    user_id: string;
    folio: string;
    status: DbOrderStatus;
    total_amount: number;
    currency: string;
    items: InternalOrderItemSnapshot[];
    geo_location: GeoLocation | null;
    lead_id: number | null;
    pricing_version: number | null;
    price_breakdown: PricingSnapshot | null;
    legacy_folio_raw: string | null;
    external_ref: string | null;
    ordered_at: string | null;
    customer_id: string | null;
    seller_id: string | null;
    delivery_address_text: string | null;
    delivery_address_id: string | null;
    scheduled_date: string | null;
    scheduled_window_start: string | null;
    scheduled_window_end: string | null;
    scheduled_slot_code: string | null;
    scheduled_time_label: string | null;
    service_type: 'bombeado' | 'tirado' | null;
    product_id: string | null;
    quantity_m3: number | null;
    unit_price_before_vat: number | null;
    vat_rate: number | null;
    total_before_vat: number | null;
    total_with_vat: number | null;
    pricing_snapshot_json: PricingSnapshotJson | null;
    payments_summary_json: PaymentsSummaryJson | null;
    balance_amount: number | null;
    order_status: DbOrderStatus | null;
    payment_status: DbPaymentStatus | null;
    fiscal_status: DbFiscalStatus | null;
    supplier_name_text: string | null;
    commission_snapshot_json: Json | null;
    internal_notes: string | null;
    import_source: string | null;
    import_batch_id: string | null;
    import_row_hash: string | null;
}

export interface DatabaseRowLeads extends AttributionFields, DeliveryFields {
    id: number;
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

export interface DatabaseRowOrderPayment extends TimestampFields {
    id: string;
    order_id: string;
    direction: DbPaymentDirection;
    kind: DbPaymentKind;
    method: DbPaymentMethod;
    amount: number;
    currency: string;
    paid_at: string;
    reference: string | null;
    receipt_number: string | null;
    notes: string | null;
    created_by: string | null;
    voided_at: string | null;
    void_reason: string | null;
}

export interface DatabaseRowOrderStatusHistory {
    id: string;
    order_id: string;
    from_status: DbOrderStatus | null;
    to_status: DbOrderStatus;
    reason: string | null;
    changed_by: string | null;
    changed_at: string;
}

export interface DatabaseRowOrderFiscalData extends TimestampFields {
    order_id: string;
    requires_invoice: boolean;
    invoice_status: DbFiscalStatus;
    invoice_requested_at: string | null;
    invoice_number: string | null;
    rfc: string | null;
    razon_social: string | null;
    cfdi_use: string | null;
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
                    status?: DbOrderStatus;
                    total_amount: number;
                    currency?: string;
                    items: InternalOrderItemSnapshot[];
                    geo_location?: GeoLocation | null;
                    created_at?: string;
                    updated_at?: string;
                    lead_id?: number | null;
                    pricing_version?: number | null;
                    price_breakdown?: PricingSnapshot | null;
                    legacy_folio_raw?: string | null;
                    external_ref?: string | null;
                    ordered_at?: string | null;
                    customer_id?: string | null;
                    seller_id?: string | null;
                    delivery_address_text?: string | null;
                    delivery_address_id?: string | null;
                    scheduled_date?: string | null;
                    scheduled_window_start?: string | null;
                    scheduled_window_end?: string | null;
                    scheduled_slot_code?: string | null;
                    scheduled_time_label?: string | null;
                    service_type?: 'bombeado' | 'tirado' | null;
                    product_id?: string | null;
                    quantity_m3?: number | null;
                    unit_price_before_vat?: number | null;
                    vat_rate?: number | null;
                    total_before_vat?: number | null;
                    total_with_vat?: number | null;
                    pricing_snapshot_json?: PricingSnapshotJson | null;
                    payments_summary_json?: PaymentsSummaryJson | null;
                    balance_amount?: number | null;
                    order_status?: DbOrderStatus | null;
                    payment_status?: DbPaymentStatus | null;
                    fiscal_status?: DbFiscalStatus | null;
                    supplier_name_text?: string | null;
                    commission_snapshot_json?: Json | null;
                    internal_notes?: string | null;
                    import_source?: string | null;
                    import_batch_id?: string | null;
                    import_row_hash?: string | null;
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
            order_payments: {
                Row: DatabaseRowOrderPayment;
                Insert: {
                    id?: string;
                    order_id: string;
                    direction: DbPaymentDirection;
                    kind: DbPaymentKind;
                    method: DbPaymentMethod;
                    amount: number;
                    currency?: string;
                    paid_at?: string;
                    reference?: string | null;
                    receipt_number?: string | null;
                    notes?: string | null;
                    created_by?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    voided_at?: string | null;
                    void_reason?: string | null;
                };
                Update: Partial<Database['public']['Tables']['order_payments']['Insert']>;
                Relationships: [];
            };
            order_status_history: {
                Row: DatabaseRowOrderStatusHistory;
                Insert: {
                    id?: string;
                    order_id: string;
                    from_status?: DbOrderStatus | null;
                    to_status: DbOrderStatus;
                    reason?: string | null;
                    changed_by?: string | null;
                    changed_at?: string;
                };
                Update: Partial<Database['public']['Tables']['order_status_history']['Insert']>;
                Relationships: [];
            };
            order_fiscal_data: {
                Row: DatabaseRowOrderFiscalData;
                Insert: {
                    order_id: string;
                    requires_invoice?: boolean;
                    invoice_status?: DbFiscalStatus;
                    invoice_requested_at?: string | null;
                    invoice_number?: string | null;
                    rfc?: string | null;
                    razon_social?: string | null;
                    cfdi_use?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database['public']['Tables']['order_fiscal_data']['Insert']>;
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
            order_status: DbOrderStatus;
            payment_status: DbPaymentStatus;
            fiscal_status: DbFiscalStatus;
            payment_direction: DbPaymentDirection;
            payment_kind: DbPaymentKind;
            payment_method: DbPaymentMethod;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}
