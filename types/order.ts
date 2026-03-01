import { type CalculatorState } from './calculator';
import { type QuoteBreakdown, type QuoteLineItem, type ConcreteType } from './quote';

export type OrderStatus =
    | 'Pendiente volumetría'
    | 'Confirmado'
    | 'En Proceso'
    | 'Finalizado'
    | 'Cancelado';

export type PaymentStatus =
    | 'Pendiente de Pago'
    | 'Parcial'
    | 'Pagado'
    | 'Cancelado';

export type PaymentDirection = 'in' | 'out';

export type PaymentKind =
    | 'Anticipo'
    | 'Abono'
    | 'Liquidación'
    | 'Ajuste'
    | 'Reembolso'
    | 'Contra cargo';

export type PaymentMethod =
    | 'Efectivo'
    | 'Transferencia'
    | 'Crédito'
    | 'Depósito'
    | 'Otro';

export type Client = {
    id: string;
    type: 'individual' | 'business';
    legalName: string;
    rfc?: string;
    phone: string;
    email: string;
    billingAddress?: {
        street: string;
        exteriorNumber: string;
        interiorNumber?: string;
        colony: string;
        city: string;
        state: string;
        zipCode: string;
    };
};

export type Location = {
    address: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
};

export type Seller = {
    id: string;
    name: string;
    email?: string;
};

export type OrderFinancials = {
    subtotal: number;
    vat: number;
    total: number;
    deposit: number;
    balance: number;
    currency: string;
};

export type OrderPayment = {
    id: string;
    direction: PaymentDirection;
    kind: PaymentKind;
    method: PaymentMethod;
    amount: number;
    paidAt: string;
    reference?: string;
    receiptNumber?: string;
    notes?: string;
};

export type PaymentSummary = {
    paidAmount: number;
    balanceAmount: number;
    lastPaidAt?: string | null;
};

export type OrderItem = {
    id: string;
    product_id: string;
    label: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    snapshot: {
        inputs: CalculatorState;
        results: QuoteBreakdown;
    };
};

export type Order = {
    id: string;
    folio: string;
    createdAt: number;
    updatedAt: number;
    scheduledDate?: string;
    client: Client;
    deliveryLocation: Location;
    seller?: Seller;
    items: OrderItem[];
    financials: OrderFinancials;
    payments?: OrderPayment[];
    paymentSummary?: PaymentSummary;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    notes?: string;
};

export type ProductType = 'concrete' | 'additive' | 'service';

export type Product = {
    id: string;
    type: ProductType;
    label: string;
    description?: string;
    active: boolean;
    metadata?: Record<string, unknown>;
};

export type CartItem = {
    id: string;
    timestamp: number;
    inputs: CalculatorState;
    results: QuoteBreakdown;
    config: {
        label: string;
    };
    customer?: CustomerInfo;
    folio?: string;
};

export type CustomerInfo = {
    name: string;
    phone: string;
    visitorId?: string;
    email?: string;
};

export type OrderPayload = {
    folio: string;
    customer: CustomerInfo;
    items: {
        id: string;
        label: string;
        volume: number;
        service: ConcreteType;
        subtotal: number;
        additives?: string[];
    }[];
    financials: {
        subtotal: number;
        vat: number;
        total: number;
        currency: string;
    };
    breakdownLines?: QuoteLineItem[];
    metadata: {
        source: 'web_calculator';
        pricing_version?: number;
        utm_source?: string;
        utm_medium?: string;
        userAgent?: string;
        deliveryAddress?: string;
        deliveryDate?: string;
        deliveryTime?: string;
        notes?: string;
    };
};
