import { z } from 'zod';
// Note: Additional comments/documentation for future schema evolution
import { orderStatusSchema } from './order-status';
import { paymentDirectionSchema, paymentKindSchema, paymentMethodSchema } from './order-payments';

const sortBySchema = z.enum([
    'ordered_at',
    'scheduled_date',
    'total_with_vat',
    'balance_amount',
    'order_status',
    'payment_status',
]);

const sortDirSchema = z.enum(['asc', 'desc']);

const statusFilterSchema = z.union([orderStatusSchema, z.literal('')]).optional();

const paymentStatusFilterSchema = z.enum(['pending', 'partial', 'paid', 'overpaid', '']).optional();

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido');

export const orderListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(5).max(100).default(20),
    sortBy: sortBySchema.default('ordered_at'),
    sortDir: sortDirSchema.default('desc'),
    status: statusFilterSchema,
    payment_status: paymentStatusFilterSchema,
    folio: z.string().trim().max(50).optional(),
    dateFrom: dateOnlySchema.optional(),
    dateTo: dateOnlySchema.optional(),
    sellerId: z.string().uuid('Vendedor inválido').optional(),
    stage: z.enum(['', 'draft_order', 'confirmed', 'completed', 'cancelled']).optional(),
    search: z.string().trim().max(100).optional(),
}).superRefine((data, ctx) => {
    if (data.dateFrom && data.dateTo && data.dateFrom > data.dateTo) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['dateTo'],
            message: 'La fecha final no puede ser menor a la fecha inicial',
        });
    }
});

export const orderIdSchema = z.string().uuid('ID de pedido inválido');

export const orderUpdatePayloadSchema = z.object({
    orderId: orderIdSchema,
    delivery_address_text: z.string().trim().min(5).max(300).nullable().optional(),
    delivery_address_id: z.string().uuid('Dirección inválida').nullable().optional(),
    scheduled_date: dateOnlySchema.nullable().optional(),
    scheduled_slot_code: z.string().trim().min(1).max(30).nullable().optional(),
    scheduled_time_label: z.string().trim().max(120).nullable().optional(),
    scheduled_window_start: z.string().trim().max(120).nullable().optional(),
    scheduled_window_end: z.string().trim().max(120).nullable().optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
    external_ref: z.string().trim().max(128).nullable().optional(),
    seller_id: z.string().uuid('Vendedor inválido').nullable().optional(),
    legacy_product_raw: z.string().trim().max(120).nullable().optional(),
    import_source: z.string().trim().max(120).nullable().optional(),
    import_batch_id: z.string().trim().max(120).nullable().optional(),
    import_row_hash: z.string().trim().max(120).nullable().optional(),
    legacy_folio_raw: z.string().trim().max(120).nullable().optional(),
    utm_source: z.string().trim().max(120).nullable().optional(),
    utm_medium: z.string().trim().max(120).nullable().optional(),
    utm_campaign: z.string().trim().max(120).nullable().optional(),
}).superRefine((data, ctx) => {
    if (data.scheduled_slot_code && !data.scheduled_date) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['scheduled_date'],
            message: 'Selecciona una fecha al asignar una franja horaria',
        });
    }
});

export const cancelOrderPayloadSchema = z.object({
    orderId: orderIdSchema,
    reason: z.string().trim().min(8, 'La razón de cancelación es obligatoria').max(300),
});

export const createPaymentForOrderSchema = z.object({
    orderId: orderIdSchema,
    direction: paymentDirectionSchema,
    kind: paymentKindSchema,
    method: paymentMethodSchema,
    amount: z.coerce.number().positive('El monto debe ser mayor a cero'),
    paidAt: z.string().datetime().optional(),
    reference: z.string().trim().max(120).optional(),
    receiptNumber: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(500).optional(),
});

export type OrderListQueryInput = z.infer<typeof orderListQuerySchema>;
export type OrderUpdatePayloadInput = z.infer<typeof orderUpdatePayloadSchema>;
export type CancelOrderPayloadInput = z.infer<typeof cancelOrderPayloadSchema>;
export type CreatePaymentForOrderInput = z.infer<typeof createPaymentForOrderSchema>;
