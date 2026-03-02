import type { DbLeadStatus } from '../database-enums';
import type { Json } from './json';
import type { AttributionFields, TimestampFields, BaseRow } from './base';

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
    rfc: string | null;
    billing_enabled: boolean | null;
    billing_regimen: string | null;
    cfdi_use: string | null;
    postal_code: string | null;
    quality_tier: string | null;
    legacy_notes: string | null;
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
