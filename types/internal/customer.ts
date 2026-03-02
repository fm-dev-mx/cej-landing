import type { Database } from '@/types/database';

export type CustomerIdentityStatus = Database['public']['Tables']['customers']['Row']['identity_status'];
export type CustomerIdentityType = Database['public']['Tables']['customer_identities']['Row']['type'];

export interface CustomerSummary {
    id: string;
    display_name: string;
    primary_phone_norm: string | null;
    primary_email_norm: string | null;
    identity_status: CustomerIdentityStatus;
    orders_total: number;
    ltv_mxn: number;
    active_open_orders: number;
    last_order_date: string | null;
}

export interface CustomerListQuery {
    page?: number;
    pageSize?: number;
    search?: string;
    identity_status?: CustomerIdentityStatus;
}

export interface CustomerListResult {
    success: boolean;
    customers: CustomerSummary[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    error?: string;
}

export interface CustomerDetail extends CustomerSummary {
    created_at: string;
    updated_at: string;
    average_order_value_mxn: number;
    paid_mxn: number;
    pending_mxn: number;
    legacy_notes: string | null;
    rfc: string | null;
    billing_enabled: boolean | null;
    billing_regimen: string | null;
    cfdi_use: string | null;
    postal_code: string | null;
    attribution: {
        top_source: string | null;
        top_campaign: string | null;
        first_touch_at: string | null;
        last_touch_at: string | null;
    };
    orders: Array<{
        id: string;
        folio: string;
        ordered_at: string;
        order_status: Database['public']['Tables']['orders']['Row']['order_status'];
        payment_status: Database['public']['Tables']['orders']['Row']['payment_status'];
        total_with_vat: number;
        balance_amount: number;
    }>;
    identities: Array<{
        id: string;
        type: CustomerIdentityType;
        value_norm: string;
        is_primary: boolean;
        verified_at: string | null;
    }>;
}
