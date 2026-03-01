import type {
    DbOrderStatus,
    DbPaymentStatus,
    DbPaymentDirection,
    DbPaymentKind,
    DbPaymentMethod,
} from '@/types/database-enums';
import type { Database } from '@/types/database';

export type AdminOrderSortBy =
    | 'ordered_at'
    | 'scheduled_date'
    | 'total_with_vat'
    | 'balance_amount'
    | 'order_status'
    | 'payment_status';

export type SortDir = 'asc' | 'desc';

export interface OrderListQuery {
    page?: number;
    pageSize?: number;
    sortBy?: AdminOrderSortBy;
    sortDir?: SortDir;
    status?: DbOrderStatus | '';
    payment_status?: DbPaymentStatus | '';
    folio?: string;
    dateFrom?: string;
    dateTo?: string;
    sellerId?: string;
}

export interface OrderListItem {
    id: string;
    folio: string;
    order_status: DbOrderStatus;
    payment_status: DbPaymentStatus;
    total_with_vat: number;
    balance_amount: number;
    quantity_m3: number;
    ordered_at: string;
    scheduled_date: string | null;
    seller_id: string | null;
}

export interface OrderListResult {
    success: boolean;
    orders: OrderListItem[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    error?: string;
}

export interface ProfileOption {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
}

export interface ServiceSlotOption {
    slot_code: string;
    label: string;
    start_time: string;
    end_time: string;
}

export interface OrderPaymentRecord {
    id: string;
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

export interface OrderStatusHistoryRecord {
    id: string;
    from_status: DbOrderStatus | null;
    to_status: DbOrderStatus;
    reason: string | null;
    changed_by: string | null;
    changed_at: string;
}

export interface OrderFiscalRecord {
    requires_invoice: boolean;
    invoice_requested_at: string | null;
    invoice_number: string | null;
    rfc: string | null;
    razon_social: string | null;
    cfdi_use: string | null;
}

export interface OrderDetail {
    order: Database['public']['Tables']['orders']['Row'];
    payments: OrderPaymentRecord[];
    statusHistory: OrderStatusHistoryRecord[];
    fiscalData: OrderFiscalRecord | null;
    profiles: Record<string, ProfileOption>;
    serviceSlot: ServiceSlotOption | null;
}

export interface OrderUpdatePayload {
    orderId: string;
    delivery_address_text?: string | null;
    scheduled_date?: string | null;
    scheduled_slot_code?: string | null;
    scheduled_time_label?: string | null;
    scheduled_window_start?: string | null;
    scheduled_window_end?: string | null;
    notes?: string | null;
    external_ref?: string | null;
    seller_id?: string | null;
}

export interface CancelOrderPayload {
    orderId: string;
    reason: string;
}
