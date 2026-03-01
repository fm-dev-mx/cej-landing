import { z } from 'zod';

/**
 * orderStatusSchema
 * Aligned with public.order_status_enum in Supabase canonical schema.
 * ENUM: 'draft', 'confirmed', 'scheduled', 'in_progress', 'completed', 'cancelled'
 */
export const orderStatusSchema = z.enum([
    'draft',
    'confirmed',
    'scheduled',
    'in_progress',
    'completed',
    'cancelled'
]);

export type InternalOrderStatus = z.infer<typeof orderStatusSchema>;

export const updateOrderStatusPayloadSchema = z.object({
    orderId: z.string().uuid('ID de pedido inválido'),
    newStatus: orderStatusSchema,
    reason: z.string().trim().max(300).optional(),
});

export type UpdateOrderStatusPayload = z.infer<typeof updateOrderStatusPayloadSchema>;

/**
 * ALLOWED_TRANSITIONS
 * State machine for order processing.
 */
export const ALLOWED_TRANSITIONS: Record<InternalOrderStatus, InternalOrderStatus[]> = {
    draft: ['confirmed', 'scheduled', 'cancelled'],
    confirmed: ['scheduled', 'in_progress', 'cancelled'],
    scheduled: ['in_progress', 'completed', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [], // Terminal successfully
    cancelled: [], // Terminal failure
};

export function canTransition(current: InternalOrderStatus, next: InternalOrderStatus): boolean {
    if (current === next) return true;
    return ALLOWED_TRANSITIONS[current]?.includes(next) ?? false;
}
