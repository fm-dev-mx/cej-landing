export type InternalConcreteType = 'direct' | 'pumped';

export type InternalOrderStatus =
    | 'draft'
    | 'pending_payment'
    | 'scheduled'
    | 'delivered'
    | 'cancelled';

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
    deliveryDate?: string;
    notes?: string;
}
