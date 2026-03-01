import { z } from 'zod';
import type { InternalOrderStatus } from '@/types/internal/order';

export const orderStatusSchema = z.enum([
    'draft',
    'pending_payment',
    'scheduled',
    'delivered',
    'cancelled'
]);

export const updateOrderStatusPayloadSchema = z.object({
    orderId: z.string().uuid('ID de pedido inválido'),
    newStatus: orderStatusSchema,
});

export type UpdateOrderStatusPayload = z.infer<typeof updateOrderStatusPayloadSchema>;

export const ALLOWED_TRANSITIONS: Record<InternalOrderStatus, InternalOrderStatus[]> = {
    draft: ['pending_payment', 'scheduled', 'cancelled'],
    pending_payment: ['scheduled', 'cancelled'],
    scheduled: ['delivered', 'cancelled'],
    delivered: [], // Terminal
    cancelled: [], // Terminal
};

export function canTransition(current: InternalOrderStatus, next: InternalOrderStatus): boolean {
    if (current === next) return true; // No-op is valid (idempotent UI)
    return ALLOWED_TRANSITIONS[current]?.includes(next) ?? false;
}
