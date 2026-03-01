export type InternalConcreteType = 'direct' | 'pumped';

export type InternalOrderStatus =
    | 'draft'
    | 'pending_payment'
    | 'scheduled'
    | 'delivered'
    | 'cancelled';

export type InternalPaymentStatus =
    | 'pending'
    | 'partial'
    | 'paid'
    | 'cancelled';

export type InternalFiscalStatus =
    | 'not_requested'
    | 'requested'
    | 'issued'
    | 'cancelled';

export type InternalPaymentDirection = 'in' | 'out';

export type InternalPaymentKind =
    | 'anticipo'
    | 'abono'
    | 'liquidacion'
    | 'ajuste'
    | 'refund'
    | 'chargeback';

export type InternalPaymentMethod =
    | 'efectivo'
    | 'transferencia'
    | 'credito'
    | 'deposito'
    | 'otro';

export interface PaymentSummarySnapshot {
    paid_amount: number;
    balance_amount: number;
    last_paid_at: string | null;
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
    orderedAt?: string;
    deliveryDate?: string;
    scheduledWindowStart?: string;
    scheduledWindowEnd?: string;
    scheduledSlotCode?: string;
    scheduledTimeLabel?: string;
    externalRef?: string;
    legacyFolioRaw?: string;
    notes?: string;
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
