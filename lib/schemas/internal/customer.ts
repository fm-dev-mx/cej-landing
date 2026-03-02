import { z } from 'zod';

const customerFields = {
    display_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    phone: z.string().min(10, 'El teléfono debe tener un mínimo de 10 dígitos').max(20, 'El teléfono es demasiado largo'),
    email: z.string().email('Debe ser un email válido').optional().or(z.literal('')),
    rfc: z.string().optional().nullable(),
    billing_enabled: z.boolean().optional().default(false),
    billing_regimen: z.string().optional().nullable(),
    cfdi_use: z.string().optional().nullable(),
    postal_code: z.string().optional().nullable(),
    quality_tier: z.enum(['bronze', 'silver', 'gold', 'platinum']).optional().nullable(),
    legacy_notes: z.string().optional().nullable(),
};

export const adminCustomerPayloadSchema = z.object(customerFields);

export const updateAdminCustomerSchema = z.object({
    ...customerFields,
    customerId: z.string().uuid('ID de cliente inválido'),
    display_name: customerFields.display_name.optional(),
    phone: customerFields.phone.optional().nullable(),
    email: customerFields.email.nullable(),
    billing_enabled: z.boolean().optional().nullable(),
});

export type AdminCustomerPayload = z.infer<typeof adminCustomerPayloadSchema>;
export type UpdateAdminCustomerPayload = z.infer<typeof updateAdminCustomerSchema>;
