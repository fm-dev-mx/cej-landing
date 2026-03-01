import type { DbLeadStatus, DbOrderStatus, DbPaymentStatus } from '@/types/database-enums';

export type OperationsStage =
    | 'new_lead'
    | 'qualified'
    | 'draft_order'
    | 'confirmed'
    | 'completed'
    | 'cancelled';

export interface OperationsWorkItem {
    item_type: 'lead' | 'order';
    item_id: string;
    stage: OperationsStage;
    created_at: string;
    display_name: string;
    phone_norm: string | null;
    source: string | null;
    amount_mxn: number | null;
    order_status: DbOrderStatus | null;
    payment_status: DbPaymentStatus | null;
    lead_status: DbLeadStatus | null;
    order_id: string | null;
    lead_id: number | null;
    customer_id: string | null;
}

export interface OperationsListQuery {
    stage?: '' | OperationsStage;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
}

export interface OperationsListResult {
    success: boolean;
    items: OperationsWorkItem[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    error?: string;
}

