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

export const adminLeadPayloadSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    phone: z.string().min(10, 'El teléfono debe tener un mínimo de 10 dígitos').max(20, 'El teléfono es demasiado largo'),
    delivery_date: z.string().optional().nullable(),
    delivery_address: z.string().optional().nullable(),
    notes: z.string().max(500, 'Las notas son demasiado largas').optional().nullable(),
    status: leadStatusEnum.optional().default('new'),
});

export const updateAdminLeadSchema = z.object({
    leadId: z.number(),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    phone: z.string().min(10, 'El teléfono debe tener un mínimo de 10 dígitos').optional(),
    delivery_date: z.string().optional().nullable(),
    delivery_address: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    status: leadStatusEnum.optional(),
    lost_reason: z.string().optional().nullable(),
});

export type AdminLeadPayload = z.infer<typeof adminLeadPayloadSchema>;
export type UpdateAdminLeadPayload = z.infer<typeof updateAdminLeadSchema>;
