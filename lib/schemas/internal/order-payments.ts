import { z } from 'zod';

export const paymentDirectionSchema = z.enum(['in', 'out']);
export const paymentKindSchema = z.enum([
    'anticipo',
    'abono',
    'liquidacion',
    'ajuste',
    'refund',
    'chargeback'
]);
export const paymentMethodSchema = z.enum([
    'efectivo',
    'transferencia',
    'credito',
    'deposito',
    'otro'
]);

export const createOrderPaymentPayloadSchema = z.object({
    orderId: z.string().uuid('ID de pedido inválido'),
    direction: paymentDirectionSchema,
    kind: paymentKindSchema,
    method: paymentMethodSchema,
    amount: z.number().positive('El monto debe ser mayor a cero'),
    paidAt: z.string().datetime().optional(),
    reference: z.string().trim().max(120).optional(),
    receiptNumber: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(500).optional(),
});

export type CreateOrderPaymentPayload = z.infer<typeof createOrderPaymentPayloadSchema>;
