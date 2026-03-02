import type { PricingRules } from '@/lib/schemas/pricing';
import type {
    DbOrderStatus,
    DbPaymentStatus,
    DbFiscalStatus,
    DbPaymentDirection,
    DbPaymentKind,
    DbPaymentMethod,
    DbLeadStatus
} from '../database-enums';
import type { Json, JsonObject } from './json';
import type { PaymentsSummaryJson, PricingSnapshotJson } from './snapshots';

export interface TimestampFields {
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
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

export interface BaseRow extends TimestampFields {
    id: string;
}

export interface BaseOrderEntry extends BaseRow {
    order_id: string;
}

export interface ImportFields {
    import_source: string | null;
    import_batch_id: string | null;
    import_row_hash: string | null;
    legacy_folio_raw: string | null;
}

export interface DatabaseRowOrders extends BaseRow, AttributionFields, ImportFields {
    folio: string;
    user_id: string;
    seller_id: string | null;
    created_by: string | null;
    order_status: DbOrderStatus;
    payment_status: DbPaymentStatus;
    fiscal_status: DbFiscalStatus;
    ordered_at: string;
    service_type: 'bombeado' | 'tirado' | null;
    product_id: string | null;
    quantity_m3: number | null;
    unit_price_before_vat: number | null;
    vat_rate: number | null;
    total_before_vat: number | null;
    total_with_vat: number | null;
    pricing_snapshot_json: PricingSnapshotJson;
    payments_summary_json: PaymentsSummaryJson;
    balance_amount: number;
    delivery_address_text: string | null;
    delivery_address_id: string | null;
    scheduled_date: string | null;
    scheduled_slot_code: string | null;
    scheduled_time_label: string | null;
    scheduled_window_start: string | null;
    scheduled_window_end: string | null;
    lead_id: number | null;
    customer_id: string | null;
    visitor_id: string | null;
    fb_event_id: string | null;
    attribution_extra_json: JsonObject;
    external_ref: string | null;
    notes: string | null;
}

export interface DatabaseRowLeads extends AttributionFields, TimestampFields {
    id: number;
    name: string;
    phone: string;
    phone_norm: string | null;
    status: DbLeadStatus;
    quote_data: Json;
    customer_id: string | null;
    visitor_id: string | null;
    fb_event_id: string | null;
    delivery_date: string | null;
    delivery_address: string | null;
    notes: string | null;
    lost_reason: string | null;
    privacy_accepted: boolean;
    privacy_accepted_at: string | null;
}

export interface DatabaseRowCustomers extends BaseRow {
    display_name: string;
    primary_phone_norm: string | null;
    primary_email_norm: string | null;
    identity_status: 'unverified' | 'verified' | 'merged';
    merged_into_customer_id: string | null;
}

export interface DatabaseRowCustomerIdentity extends BaseRow {
    customer_id: string;
    type: 'phone' | 'email' | 'visitor_id';
    value_norm: string;
    is_primary: boolean;
    verified_at: string | null;
}

export interface DatabaseRowCustomerMergeLog {
    id: string;
    survivor_customer_id: string;
    merged_customer_id: string;
    reason: string | null;
    merged_by: string | null;
    merged_at: string;
}

export interface DatabaseRowServiceSlots {
    slot_code: string;
    label: string;
    start_time: string;
    end_time: string;
}

export interface BasePriceConfig extends TimestampFields {
    id: number;
    version: number;
    pricing_rules: PricingRules;
}

export interface DatabaseRowPriceConfig extends BasePriceConfig {
    active: boolean;
}

export interface DatabaseRowOrderPayment extends BaseOrderEntry {
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

export interface DatabaseRowOrderStatusHistory extends BaseOrderEntry {
    from_status: DbOrderStatus | null;
    to_status: DbOrderStatus;
    reason: string | null;
    changed_by: string | null;
    changed_at: string;
}

export interface BaseFiscalData extends BaseOrderEntry {
    requires_invoice: boolean;
    invoice_requested_at: string | null;
    invoice_number: string | null;
}

export interface DatabaseRowOrderFiscalData extends BaseFiscalData {
    rfc: string | null;
    razon_social: string | null;
    cfdi_use: string | null;
}

export interface DatabaseRowOrderImportLog extends BaseOrderEntry, ImportFields { }
