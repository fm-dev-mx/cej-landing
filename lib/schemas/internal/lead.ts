import { z } from 'zod';
import type { DbLeadStatus } from '@/types/database-enums';

const leadStatusEnum = z.enum([
    'new',
    'contacted',
    'qualified',
    'converted',
    'lost',
    'archived',
]) as z.ZodType<DbLeadStatus>;

const trackingFields = {
    visitor_id: z.string().max(120).optional().nullable(),
    fb_event_id: z.string().max(120).optional().nullable(),
    utm_source: z.string().max(120).optional().nullable(),
    utm_medium: z.string().max(120).optional().nullable(),
    utm_campaign: z.string().max(120).optional().nullable(),
    utm_term: z.string().max(120).optional().nullable(),
    utm_content: z.string().max(120).optional().nullable(),
    fbclid: z.string().max(180).optional().nullable(),
    gclid: z.string().max(180).optional().nullable(),
};

export const adminLeadPayloadSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    phone: z.string().min(10, 'El teléfono debe tener un mínimo de 10 dígitos').max(20, 'El teléfono es demasiado largo'),
    delivery_date: z.string().optional().nullable(),
    delivery_address: z.string().optional().nullable(),
    notes: z.string().max(500, 'Las notas son demasiado largas').optional().nullable(),
    ...trackingFields,
    status: leadStatusEnum.optional().default('new'),
});

export const updateAdminLeadSchema = z.object({
    leadId: z.number(),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    phone: z.string().min(10, 'El teléfono debe tener un mínimo de 10 dígitos').optional(),
    delivery_date: z.string().optional().nullable(),
    delivery_address: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    ...trackingFields,
    status: leadStatusEnum.optional(),
    lost_reason: z.string().optional().nullable(),
});

export type AdminLeadPayload = z.infer<typeof adminLeadPayloadSchema>;
export type UpdateAdminLeadPayload = z.infer<typeof updateAdminLeadSchema>;
