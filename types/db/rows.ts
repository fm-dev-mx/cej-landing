import type {
    DbOrderStatus,
    DbPaymentStatus,
    DbFiscalStatus,
    DbPaymentDirection,
    DbPaymentKind,
    DbPaymentMethod,
    DbRecordOrigin
} from '../database-enums';
import type { JsonObject } from './json';
import type { PaymentsSummaryJson, PricingSnapshotJson } from './snapshots';
import type { BaseRow, BaseOrderEntry, AttributionFields, ImportFields } from './base';

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
    legacy_product_raw: string | null;
    record_origin: DbRecordOrigin;
    source_batch_id: string | null;
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
