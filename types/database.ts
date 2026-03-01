import type { PricingRules } from '@/lib/schemas/pricing';
import type { ConcreteType, QuoteLineItem } from './quote';
import type {
    DbOrderStatus,
    DbPaymentStatus,
    DbFiscalStatus,
    DbPaymentDirection,
    DbPaymentKind,
    DbPaymentMethod,
    DbLeadStatus
} from './database-enums';

export type {
    DbOrderStatus,
    DbPaymentStatus,
    DbFiscalStatus,
    DbPaymentDirection,
    DbPaymentKind,
    DbPaymentMethod,
    DbLeadStatus
};

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type ServiceType = ConcreteType;

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
        total: number;
        subtotal: number;
        vat: number;
        currency: string;
    };
    breakdownLines?: QuoteLineItem[];
    metadata?: Record<string, unknown>;
};

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

export interface PaymentsSummaryJson {
    total: number;
    net_paid: number;
    paid_in: number;
    paid_out: number;
    balance: number;
    last_paid_at: string | null;
    recomputed_at: string;
}

export interface PricingSnapshotJson {
    version: number;
    computed_at: string;
    inputs: {
        volume: number;
        concreteType: 'direct' | 'pumped';
        strength: string;
    };
    breakdown: Json;
}

export interface DatabaseRowOrders extends TimestampFields, AttributionFields {
    id: string;
    folio: string;

    // Ownership
    user_id: string;
    seller_id: string | null;
    created_by: string | null;

    // Operational fields
    order_status: DbOrderStatus;
    payment_status: DbPaymentStatus;
    fiscal_status: DbFiscalStatus;
    ordered_at: string;

    // Service/pricing (frozen state)
    service_type: 'bombeado' | 'tirado' | null;
    product_id: string | null;
    quantity_m3: number | null;
    unit_price_before_vat: number | null;
    vat_rate: number | null;
    total_before_vat: number | null;
    total_with_vat: number | null;
    pricing_snapshot_json: PricingSnapshotJson;

    // Financial Summaries
    payments_summary_json: PaymentsSummaryJson;
    balance_amount: number;

    // Delivery / scheduling
    delivery_address_text: string | null;
    delivery_address_id: string | null;
    scheduled_date: string | null;
    scheduled_slot_code: string | null;
    scheduled_time_label: string | null;
    scheduled_window_start: string | null;
    scheduled_window_end: string | null;

    // Attribution extensions
    lead_id: number | null;
    visitor_id: string | null;
    fb_event_id: string | null;

    // Import and sync
    import_source: string | null;
    import_batch_id: string | null;
    import_row_hash: string | null;
    legacy_folio_raw: string | null;
    external_ref: string | null;
    notes: string | null;
}

export interface DatabaseRowLeads extends AttributionFields {
    id: number;
    name: string;
    phone: string;
    phone_norm: string | null;
    status: DbLeadStatus;
    quote_data: Json;
    visitor_id: string | null;
    fb_event_id: string | null;
    delivery_date: string | null;
    delivery_address: string | null;
    notes: string | null;
    lost_reason: string | null;
    privacy_accepted: boolean;
    privacy_accepted_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface DatabaseRowServiceSlots {
    slot_code: string;
    label: string;
    start_time: string;
    end_time: string;
}

export interface DatabaseRowPriceConfig extends TimestampFields {
    id: number;
    version: number;
    pricing_rules: PricingRules;
    active: boolean;
}

export interface DatabaseRowOrderPayment extends TimestampFields {
    id: string;
    order_id: string;
    direction: DbPaymentDirection;
    kind: DbPaymentKind;
    method: DbPaymentMethod;
    amount_mxn: number;
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
    invoice_requested_at: string | null;
    invoice_number: string | null;
    rfc: string | null;
    razon_social: string | null;
    cfdi_use: string | null;
}

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    email: string | null;
                    full_name: string | null;
                    phone: string | null;
                    company_name: string | null;
                    rfc: string | null;
                    address: Json;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
                Update: Partial<Database['public']['Tables']['profiles']['Row']>;
                Relationships: [];
            };
            leads: {
                Row: DatabaseRowLeads;
                Insert: Partial<DatabaseRowLeads> & { name: string; phone: string; quote_data: Json };
                Update: Partial<DatabaseRowLeads>;
                Relationships: [];
            };
            service_slots: {
                Row: DatabaseRowServiceSlots;
                Insert: DatabaseRowServiceSlots;
                Update: Partial<DatabaseRowServiceSlots>;
                Relationships: [];
            };
            orders: {
                Row: DatabaseRowOrders;
                Insert: Partial<DatabaseRowOrders> & {
                    folio: string;
                    user_id: string;
                    quantity_m3: number;
                    unit_price_before_vat: number;
                    vat_rate: number;
                    total_before_vat: number;
                    total_with_vat: number;
                };
                Update: Partial<DatabaseRowOrders>;
                Relationships: [];
            };
            order_payments: {
                Row: DatabaseRowOrderPayment;
                Insert: Partial<DatabaseRowOrderPayment> & {
                    order_id: string;
                    direction: DbPaymentDirection;
                    kind: DbPaymentKind;
                    method: DbPaymentMethod;
                    amount_mxn: number;
                };
                Update: Partial<DatabaseRowOrderPayment>;
                Relationships: [];
            };
            order_status_history: {
                Row: DatabaseRowOrderStatusHistory;
                Insert: Partial<DatabaseRowOrderStatusHistory> & {
                    order_id: string;
                    to_status: DbOrderStatus;
                };
                Update: Partial<DatabaseRowOrderStatusHistory>;
                Relationships: [];
            };
            order_fiscal_data: {
                Row: DatabaseRowOrderFiscalData;
                Insert: {
                    order_id: string;
                    requires_invoice?: boolean;
                    invoice_requested_at?: string | null;
                    invoice_number?: string | null;
                    rfc?: string | null;
                    razon_social?: string | null;
                    cfdi_use?: string | null;
                };
                Update: Partial<Database['public']['Tables']['order_fiscal_data']['Insert']>;
                Relationships: [];
            };
            price_config: {
                Row: DatabaseRowPriceConfig;
                Insert: Partial<DatabaseRowPriceConfig> & { pricing_rules: PricingRules };
                Update: Partial<DatabaseRowPriceConfig>;
                Relationships: [];
            };
            expenses: {
                Row: {
                    id: string;
                    user_id: string;
                    amount: number;
                    currency: string;
                    category: string;
                    expense_date: string;
                    reference: string | null;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Partial<Database['public']['Tables']['expenses']['Row']> & { user_id: string; amount: number; category: string; expense_date: string };
                Update: Partial<Database['public']['Tables']['expenses']['Row']>;
                Relationships: [];
            };
            payroll: {
                Row: {
                    id: string;
                    user_id: string;
                    employee: string;
                    period_start: string;
                    period_end: string;
                    amount: number;
                    currency: string;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Partial<Database['public']['Tables']['payroll']['Row']> & { user_id: string; employee: string; period_start: string; period_end: string; amount: number };
                Update: Partial<Database['public']['Tables']['payroll']['Row']>;
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
            order_status_enum: DbOrderStatus;
            payment_status_enum: DbPaymentStatus;
            fiscal_status_enum: DbFiscalStatus;
            payment_direction_enum: DbPaymentDirection;
            payment_kind_enum: DbPaymentKind;
            payment_method_enum: DbPaymentMethod;
            lead_status_enum: DbLeadStatus;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}
