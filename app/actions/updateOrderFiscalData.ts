'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { reportError } from '@/lib/monitoring';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import { z } from 'zod';

const fiscalPayloadSchema = z.object({
    orderId: z.string().uuid('Pedido inválido'),
    requires_invoice: z.boolean(),
    invoice_requested_at: z.string().datetime().nullable().optional(),
    invoice_number: z.string().trim().max(120).nullable().optional(),
    rfc: z.string().trim().max(40).nullable().optional(),
    razon_social: z.string().trim().max(160).nullable().optional(),
    cfdi_use: z.string().trim().max(20).nullable().optional(),
});

export interface UpdateOrderFiscalDataResult {
    success: boolean;
    error?: string;
}

export async function updateOrderFiscalData(payload: z.infer<typeof fiscalPayloadSchema>): Promise<UpdateOrderFiscalDataResult> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'No autenticado' };

        const role = getUserRole(user.user_metadata);
        if (!hasPermission(role, 'orders:update') && !hasPermission(role, 'admin:all')) {
            return { success: false, error: 'Permisos insuficientes' };
        }

        const parsed = fiscalPayloadSchema.safeParse(payload);
        if (!parsed.success) return { success: false, error: 'Datos fiscales inválidos' };

        const admin = await createAdminClient();
        const data = parsed.data;

        const { error } = await admin
            .from('order_fiscal_data')
            .upsert({
                order_id: data.orderId,
                requires_invoice: data.requires_invoice,
                invoice_requested_at: data.invoice_requested_at ?? null,
                invoice_number: data.invoice_number ?? null,
                rfc: data.rfc ?? null,
                razon_social: data.razon_social ?? null,
                cfdi_use: data.cfdi_use ?? null,
            }, { onConflict: 'order_id' });

        if (error) {
            reportError(error, { action: 'updateOrderFiscalData', orderId: data.orderId });
            return { success: false, error: 'No se pudo actualizar información fiscal' };
        }

        return { success: true };
    } catch (error) {
        reportError(error, { action: 'updateOrderFiscalData', phase: 'unexpected' });
        return { success: false, error: 'Error inesperado al actualizar fiscal' };
    }
}
