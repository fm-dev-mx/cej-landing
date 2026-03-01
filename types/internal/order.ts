import type {
    DbOrderStatus,
    DbPaymentStatus,
    DbFiscalStatus,
    DbPaymentDirection,
    DbPaymentKind,
    DbPaymentMethod
} from '@/types/database-enums';

export type InternalConcreteType = 'direct' | 'pumped';

// Align internal types with canonical database enums to avoid mapping debt
export type InternalOrderStatus = DbOrderStatus;
export type InternalPaymentStatus = DbPaymentStatus;
export type InternalFiscalStatus = DbFiscalStatus;
export type InternalPaymentDirection = DbPaymentDirection;
export type InternalPaymentKind = DbPaymentKind;
export type InternalPaymentMethod = DbPaymentMethod;

/**
 * OrderSummary
 * Shared interface for listing orders in both admin and customer dashboards.
 */
export interface OrderSummary {
    id: string;
    folio: string;
    order_status: DbOrderStatus;
    payment_status: DbPaymentStatus;
    total_with_vat: number;
    balance_amount: number;
    quantity_m3: number;
    ordered_at: string;
    scheduled_date: string | null;
}

export interface PaymentSummarySnapshot {
    total: number;
    net_paid: number;
    paid_in: number;
    paid_out: number;
    balance: number;
    last_paid_at: string | null;
    recomputed_at: string;
}

export interface PricingSnapshotPayload {
    version: number;
    computed_at: string;
    inputs: {
        volume: number;
        concreteType: InternalConcreteType;
        strength: string;
    };
    breakdown: unknown;
}

export interface InternalOrderItem {
    id: string;
    label: string;
    volume: number;
    service: InternalConcreteType;
    subtotal: number;
    strength: string;
    notes?: string;
}

export interface AdminOrderPayload {
    name: string;
    phone: string;
    volume: number;
    concreteType: InternalConcreteType;
    strength: string;
    deliveryAddress: string;
    sellerId?: string;
    orderedAt?: string;
    deliveryDate?: string;
    scheduledWindowStart?: string;
    scheduledWindowEnd?: string;
    scheduledSlotCode?: string;
    scheduledTimeLabel?: string;
    externalRef?: string;
    legacyFolioRaw?: string;
    notes?: string;
    // Attribution
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    fbclid?: string;
    gclid?: string;
}

export interface CreateOrderPaymentPayload {
    orderId: string;
    direction: InternalPaymentDirection;
    kind: InternalPaymentKind;
    method: InternalPaymentMethod;
    amount: number;
    paidAt?: string;
    reference?: string;
    receiptNumber?: string;
    notes?: string;
}
