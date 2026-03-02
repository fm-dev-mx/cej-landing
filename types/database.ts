import type { PricingRules } from '@/lib/schemas/pricing';
import type {
    DbOrderStatus,
    DbPaymentStatus,
    DbFiscalStatus,
    DbPaymentDirection,
    DbPaymentKind,
    DbPaymentMethod,
    DbLeadStatus
} from './database-enums';
import type { Json, JsonObject } from './db/json';
import type {
    QuoteSnapshot,
    PaymentsSummaryJson,
    PricingSnapshotJson
} from './db/snapshots';
import type {
    DatabaseRowOrders,
    DatabaseRowLeads,
    DatabaseRowCustomers,
    DatabaseRowCustomerIdentity,
    DatabaseRowCustomerMergeLog,
    DatabaseRowServiceSlots,
    DatabaseRowPriceConfig,
    DatabaseRowOrderPayment,
    DatabaseRowOrderStatusHistory,
    DatabaseRowOrderFiscalData,
    DatabaseRowOrderImportLog
} from './db/rows';

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
    DbLeadStatus
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
        };
        CompositeTypes: {
            [key: string]: never;
        };
    };
}
