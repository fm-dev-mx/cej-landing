import { z } from 'zod';

export const catalogListQuerySchema = z.object({
    search: z.string().trim().max(120).optional(),
    status: z.string().trim().max(24).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(5).max(100).default(20),
});

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido');

export const productPayloadSchema = z.object({
    sku: z.string().trim().min(2, 'SKU es obligatorio').max(64),
    name: z.string().trim().min(2, 'Nombre es obligatorio').max(120),
    category: z.string().trim().min(2, 'Categoría es obligatoria').max(80),
    provider_name: z.string().trim().max(120).nullable().optional(),
    mixer_mode: z.string().trim().max(60).nullable().optional(),
    pump_mode: z.string().trim().max(60).nullable().optional(),
    base_price_mxn: z.number().nonnegative().nullable().optional(),
    client_price_mxn: z.number().nonnegative().nullable().optional(),
    utility_mxn: z.number().nullable().optional(),
    status: z.enum(['active', 'inactive']).default('active'),
    legacy_external_id: z.string().trim().max(80).nullable().optional(),
    metadata_json: z.record(z.string(), z.unknown()).optional(),
});

export const vendorPayloadSchema = z.object({
    name: z.string().trim().min(2, 'Nombre es obligatorio').max(120),
    tax_id: z.string().trim().max(40).nullable().optional(),
    notes: z.string().trim().max(800).nullable().optional(),
});

export const assetPayloadSchema = z.object({
    code: z.string().trim().min(2, 'Código es obligatorio').max(50),
    label: z.string().trim().max(120).nullable().optional(),
    asset_type: z.enum(['truck', 'pump', 'other']),
    active: z.boolean().default(true),
});

export const employeePayloadSchema = z.object({
    full_name: z.string().trim().min(2, 'Nombre es obligatorio').max(140),
    status: z.enum(['active', 'inactive']).default('active'),
    hired_at: dateOnly.nullable().optional(),
    left_at: dateOnly.nullable().optional(),
    notes: z.string().trim().max(800).nullable().optional(),
});

export type CatalogListQueryInput = z.infer<typeof catalogListQuerySchema>;
export type ProductPayloadInput = z.infer<typeof productPayloadSchema>;
export type VendorPayloadInput = z.infer<typeof vendorPayloadSchema>;
export type AssetPayloadInput = z.infer<typeof assetPayloadSchema>;
export type EmployeePayloadInput = z.infer<typeof employeePayloadSchema>;
