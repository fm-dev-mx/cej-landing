import type { PricingRules } from '@/lib/schemas/pricing';
import type {
    DbOrderStatus,
    DbPaymentStatus,
    DbFiscalStatus,
    DbPaymentDirection,
    DbPaymentKind,
    DbPaymentMethod,
    DbLeadStatus,
    DbRecordOrigin
} from './database-enums';
import type { Json, JsonObject } from './db/json';
import type {
    QuoteSnapshot,
    PaymentsSummaryJson,
    PricingSnapshotJson
} from './db/snapshots';
import type {
    DatabaseRowOrders,
    DatabaseRowOrderPayment,
    DatabaseRowOrderStatusHistory,
    DatabaseRowOrderFiscalData,
    DatabaseRowOrderImportLog
} from './db/rows';
import type {
    DatabaseRowLeads,
    DatabaseRowCustomers,
    DatabaseRowCustomerIdentity,
    DatabaseRowCustomerMergeLog
} from './db/crm';
import type {
    DatabaseRowServiceSlots,
    DatabaseRowPriceConfig,
    DatabaseRowProduct,
    DatabaseRowVendor,
    DatabaseRowAsset,
    DatabaseRowEmployee
} from './db/catalogs';
import type {
    DatabaseRowLegacyIngestBatch,
    DatabaseRowLegacyRowRejection
} from './db/ingestion';

// Re-export core types to avoid breaking most imports
export type { Json, JsonObject, QuoteSnapshot, PaymentsSummaryJson, PricingSnapshotJson };

// Re-export enums (optional, but likely used)
export type {
    DbOrderStatus,
    DbPaymentStatus,
    DbFiscalStatus,
    DbPaymentDirection,
    DbPaymentKind,
    DbPaymentMethod,
    DbLeadStatus,
    DbRecordOrigin
};

// Main Database Type
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
                    deleted_at: string | null;
                };
                Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
                Update: Partial<Database['public']['Tables']['profiles']['Row']>;
                Relationships: [{
                    foreignKeyName: 'profiles_id_fkey';
                    columns: ['id'];
                    isOneToOne: true;
                    referencedRelation: 'users';
                    referencedColumns: ['id'];
                }];
            };
            leads: {
                Row: DatabaseRowLeads;
                Insert: Partial<DatabaseRowLeads> & { name: string; phone: string; quote_data: Json };
                Update: Partial<DatabaseRowLeads>;
                Relationships: [{
                    foreignKeyName: 'leads_customer_id_fkey';
                    columns: ['customer_id'];
                    isOneToOne: false;
                    referencedRelation: 'customers';
                    referencedColumns: ['id'];
                }];
            };
            customers: {
                Row: DatabaseRowCustomers;
                Insert: Partial<DatabaseRowCustomers> & { display_name: string };
                Update: Partial<DatabaseRowCustomers>;
                Relationships: [{
                    foreignKeyName: 'customers_merged_into_customer_id_fkey';
                    columns: ['merged_into_customer_id'];
                    isOneToOne: false;
                    referencedRelation: 'customers';
                    referencedColumns: ['id'];
                }];
            };
            customer_identities: {
                Row: DatabaseRowCustomerIdentity;
                Insert: Partial<DatabaseRowCustomerIdentity> & { customer_id: string; type: 'phone' | 'email' | 'visitor_id'; value_norm: string };
                Update: Partial<DatabaseRowCustomerIdentity>;
                Relationships: [{
                    foreignKeyName: 'customer_identities_customer_id_fkey';
                    columns: ['customer_id'];
                    isOneToOne: false;
                    referencedRelation: 'customers';
                    referencedColumns: ['id'];
                }];
            };
            customer_merge_log: {
                Row: DatabaseRowCustomerMergeLog;
                Insert: Partial<DatabaseRowCustomerMergeLog> & { survivor_customer_id: string; merged_customer_id: string };
                Update: Partial<DatabaseRowCustomerMergeLog>;
                Relationships: [{
                    foreignKeyName: 'customer_merge_log_survivor_customer_id_fkey';
                    columns: ['survivor_customer_id'];
                    isOneToOne: false;
                    referencedRelation: 'customers';
                    referencedColumns: ['id'];
                }, {
                    foreignKeyName: 'customer_merge_log_merged_customer_id_fkey';
                    columns: ['merged_customer_id'];
                    isOneToOne: false;
                    referencedRelation: 'customers';
                    referencedColumns: ['id'];
                }, {
                    foreignKeyName: 'customer_merge_log_merged_by_fkey';
                    columns: ['merged_by'];
                    isOneToOne: false;
                    referencedRelation: 'profiles';
                    referencedColumns: ['id'];
                }];
            };
            service_slots: {
                Row: DatabaseRowServiceSlots;
                Insert: DatabaseRowServiceSlots;
                Update: Partial<DatabaseRowServiceSlots>;
                Relationships: [];
            };
            products: {
                Row: DatabaseRowProduct;
                Insert: Partial<DatabaseRowProduct> & { sku: string; name: string; category: string };
                Update: Partial<DatabaseRowProduct>;
                Relationships: [];
            };
            vendors: {
                Row: DatabaseRowVendor;
                Insert: Partial<DatabaseRowVendor> & { name: string };
                Update: Partial<DatabaseRowVendor>;
                Relationships: [];
            };
            assets: {
                Row: DatabaseRowAsset;
                Insert: Partial<DatabaseRowAsset> & { code: string };
                Update: Partial<DatabaseRowAsset>;
                Relationships: [];
            };
            employees: {
                Row: DatabaseRowEmployee;
                Insert: Partial<DatabaseRowEmployee> & { full_name: string };
                Update: Partial<DatabaseRowEmployee>;
                Relationships: [];
            };
            legacy_ingest_batches: {
                Row: DatabaseRowLegacyIngestBatch;
                Insert: Partial<DatabaseRowLegacyIngestBatch> & { source_name: string; source_file: string };
                Update: Partial<DatabaseRowLegacyIngestBatch>;
                Relationships: [];
            };
            legacy_row_rejections: {
                Row: DatabaseRowLegacyRowRejection;
                Insert: Partial<DatabaseRowLegacyRowRejection> & { source_name: string; row_number: number; reason_code: string; raw_payload_json: JsonObject };
                Update: Partial<DatabaseRowLegacyRowRejection>;
                Relationships: [];
            };
            payment_methods: {
                Row: {
                    code: string;
                    label: string;
                    active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Partial<Database['public']['Tables']['payment_methods']['Row']> & { code: string; label: string };
                Update: Partial<Database['public']['Tables']['payment_methods']['Row']>;
                Relationships: [];
            };
            expense_categories: {
                Row: {
                    code: string;
                    label: string;
                    active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Partial<Database['public']['Tables']['expense_categories']['Row']> & { code: string; label: string };
                Update: Partial<Database['public']['Tables']['expense_categories']['Row']>;
                Relationships: [];
            };
            service_status_legacy_map: {
                Row: {
                    legacy_status: string;
                    mapped_order_status: DbOrderStatus;
                    requires_attention: boolean;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Partial<Database['public']['Tables']['service_status_legacy_map']['Row']> & { legacy_status: string; mapped_order_status: DbOrderStatus };
                Update: Partial<Database['public']['Tables']['service_status_legacy_map']['Row']>;
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
                Relationships: [{
                    foreignKeyName: 'orders_user_id_fkey';
                    columns: ['user_id'];
                    isOneToOne: false;
                    referencedRelation: 'profiles';
                    referencedColumns: ['id'];
                }, {
                    foreignKeyName: 'orders_seller_id_fkey';
                    columns: ['seller_id'];
                    isOneToOne: false;
                    referencedRelation: 'profiles';
                    referencedColumns: ['id'];
                }, {
                    foreignKeyName: 'orders_created_by_fkey';
                    columns: ['created_by'];
                    isOneToOne: false;
                    referencedRelation: 'profiles';
                    referencedColumns: ['id'];
                }, {
                    foreignKeyName: 'orders_scheduled_slot_code_fkey';
                    columns: ['scheduled_slot_code'];
                    isOneToOne: false;
                    referencedRelation: 'service_slots';
                    referencedColumns: ['slot_code'];
                }, {
                    foreignKeyName: 'orders_lead_id_fkey';
                    columns: ['lead_id'];
                    isOneToOne: false;
                    referencedRelation: 'leads';
                    referencedColumns: ['id'];
                }, {
                    foreignKeyName: 'orders_customer_id_fkey';
                    columns: ['customer_id'];
                    isOneToOne: false;
                    referencedRelation: 'customers';
                    referencedColumns: ['id'];
                }, {
                    foreignKeyName: 'orders_product_id_fkey';
                    columns: ['product_id'];
                    isOneToOne: false;
                    referencedRelation: 'products';
                    referencedColumns: ['sku'];
                }, {
                    foreignKeyName: 'orders_source_batch_id_fkey';
                    columns: ['source_batch_id'];
                    isOneToOne: false;
                    referencedRelation: 'legacy_ingest_batches';
                    referencedColumns: ['id'];
                }];
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
                Relationships: [{
                    foreignKeyName: 'order_payments_order_id_fkey';
                    columns: ['order_id'];
                    isOneToOne: false;
                    referencedRelation: 'orders';
                    referencedColumns: ['id'];
                }, {
                    foreignKeyName: 'order_payments_created_by_fkey';
                    columns: ['created_by'];
                    isOneToOne: false;
                    referencedRelation: 'profiles';
                    referencedColumns: ['id'];
                }];
            };
            order_status_history: {
                Row: DatabaseRowOrderStatusHistory;
                Insert: Partial<DatabaseRowOrderStatusHistory> & {
                    order_id: string;
                    to_status: DbOrderStatus;
                };
                Update: Partial<DatabaseRowOrderStatusHistory>;
                Relationships: [{
                    foreignKeyName: 'order_status_history_order_id_fkey';
                    columns: ['order_id'];
                    isOneToOne: false;
                    referencedRelation: 'orders';
                    referencedColumns: ['id'];
                }, {
                    foreignKeyName: 'order_status_history_changed_by_fkey';
                    columns: ['changed_by'];
                    isOneToOne: false;
                    referencedRelation: 'profiles';
                    referencedColumns: ['id'];
                }];
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
                Relationships: [{
                    foreignKeyName: 'order_fiscal_data_order_id_fkey';
                    columns: ['order_id'];
                    isOneToOne: true;
                    referencedRelation: 'orders';
                    referencedColumns: ['id'];
                }];
            };
            order_import_log: {
                Row: DatabaseRowOrderImportLog;
                Insert: Partial<DatabaseRowOrderImportLog> & { order_id: string };
                Update: Partial<DatabaseRowOrderImportLog>;
                Relationships: [{
                    foreignKeyName: 'order_import_log_order_id_fkey';
                    columns: ['order_id'];
                    isOneToOne: true;
                    referencedRelation: 'orders';
                    referencedColumns: ['id'];
                }];
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
                    vendor_id: string | null;
                    asset_id: string | null;
                    payment_method_code: string | null;
                    is_reconciled: boolean;
                    legacy_external_id: string | null;
                    record_origin: DbRecordOrigin;
                    source_batch_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Partial<Database['public']['Tables']['expenses']['Row']> & { user_id: string; amount: number; category: string; expense_date: string };
                Update: Partial<Database['public']['Tables']['expenses']['Row']>;
                Relationships: [{
                    foreignKeyName: 'expenses_user_id_fkey';
                    columns: ['user_id'];
                    isOneToOne: false;
                    referencedRelation: 'profiles';
                    referencedColumns: ['id'];
                }, {
                    foreignKeyName: 'expenses_vendor_id_fkey';
                    columns: ['vendor_id'];
                    isOneToOne: false;
                    referencedRelation: 'vendors';
                    referencedColumns: ['id'];
                }, {
                    foreignKeyName: 'expenses_asset_id_fkey';
                    columns: ['asset_id'];
                    isOneToOne: false;
                    referencedRelation: 'assets';
                    referencedColumns: ['id'];
                }, {
                    foreignKeyName: 'expenses_payment_method_code_fkey';
                    columns: ['payment_method_code'];
                    isOneToOne: false;
                    referencedRelation: 'payment_methods';
                    referencedColumns: ['code'];
                }, {
                    foreignKeyName: 'expenses_source_batch_id_fkey';
                    columns: ['source_batch_id'];
                    isOneToOne: false;
                    referencedRelation: 'legacy_ingest_batches';
                    referencedColumns: ['id'];
                }];
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
                    employee_id: string | null;
                    base_salary: number | null;
                    commission_amount: number | null;
                    loan_discount: number | null;
                    overtime_amount: number | null;
                    trip_amount: number | null;
                    volume_m3: number | null;
                    days_worked: number | null;
                    legacy_external_id: string | null;
                    record_origin: DbRecordOrigin;
                    source_batch_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Partial<Database['public']['Tables']['payroll']['Row']> & { user_id: string; employee: string; period_start: string; period_end: string; amount: number };
                Update: Partial<Database['public']['Tables']['payroll']['Row']>;
                Relationships: [{
                    foreignKeyName: 'payroll_user_id_fkey';
                    columns: ['user_id'];
                    isOneToOne: false;
                    referencedRelation: 'profiles';
                    referencedColumns: ['id'];
                }, {
                    foreignKeyName: 'payroll_employee_id_fkey';
                    columns: ['employee_id'];
                    isOneToOne: false;
                    referencedRelation: 'employees';
                    referencedColumns: ['id'];
                }, {
                    foreignKeyName: 'payroll_source_batch_id_fkey';
                    columns: ['source_batch_id'];
                    isOneToOne: false;
                    referencedRelation: 'legacy_ingest_batches';
                    referencedColumns: ['id'];
                }];
            };
        };
        Views: {
            [key: string]: never;
        };
        Functions: {
            [key: string]: never;
        };
        Enums: {
            order_status_enum: DbOrderStatus;
            payment_status_enum: DbPaymentStatus;
            fiscal_status_enum: DbFiscalStatus;
            payment_direction_enum: DbPaymentDirection;
            payment_kind_enum: DbPaymentKind;
            payment_method_enum: DbPaymentMethod;
            lead_status_enum: DbLeadStatus;
            record_origin_enum: DbRecordOrigin;
        };
        CompositeTypes: {
            [key: string]: never;
        };
    };
}
