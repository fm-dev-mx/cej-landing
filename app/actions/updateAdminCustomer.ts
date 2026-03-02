'use server';

import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';
import { updateAdminCustomerSchema } from '@/lib/schemas/internal/customer';
import type { UpdateAdminCustomerPayload } from '@/lib/schemas/internal/customer';
import { reportError } from '@/lib/monitoring';

export type UpdateAdminCustomerResult =
    | { status: 'success' }
    | { status: 'error'; message: string };

function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('52')) return digits;
    if (digits.length === 10) return `52${digits}`;
    return digits;
}

export async function updateAdminCustomer(payload: UpdateAdminCustomerPayload): Promise<UpdateAdminCustomerResult> {
    const supabase = env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
        ? createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
            auth: { persistSession: false },
        })
        : null;

    if (!supabase) {
        return { status: 'error', message: 'Base de datos no configurada' };
    }

    const parsed = updateAdminCustomerSchema.safeParse(payload);
    if (!parsed.success) {
        return { status: 'error', message: 'Datos inválidos' };
    }

    const { customerId, ...updates } = parsed.data;

    const payloadToUpdate: Record<string, string | number | boolean | null> = {};
    if (updates.display_name !== undefined) payloadToUpdate.display_name = updates.display_name;

    let phoneNorm: string | null = null;
    if (updates.phone !== undefined) {
        phoneNorm = updates.phone ? normalizePhone(updates.phone) : null;
        payloadToUpdate.primary_phone_norm = phoneNorm;
    }

    let emailNorm: string | null = null;
    if (updates.email !== undefined) {
        emailNorm = updates.email ? updates.email.toLowerCase().trim() : null;
        payloadToUpdate.primary_email_norm = emailNorm;
    }

    if (updates.rfc !== undefined) payloadToUpdate.rfc = updates.rfc;
    if (updates.billing_enabled !== undefined) payloadToUpdate.billing_enabled = updates.billing_enabled;
    if (updates.billing_regimen !== undefined) payloadToUpdate.billing_regimen = updates.billing_regimen;
    if (updates.cfdi_use !== undefined) payloadToUpdate.cfdi_use = updates.cfdi_use;
    if (updates.postal_code !== undefined) payloadToUpdate.postal_code = updates.postal_code;
    if (updates.legacy_notes !== undefined) payloadToUpdate.legacy_notes = updates.legacy_notes;

    try {
        const { error } = await supabase
            .from('customers')
            .update(payloadToUpdate)
            .eq('id', customerId);

        if (error) {
            return { status: 'error', message: error.message || 'Error al actualizar el cliente' };
        }

        // If phone changed, sync or add to customer_identities
        if (phoneNorm) {
            await supabase.from('customer_identities').upsert({
                customer_id: customerId,
                type: 'phone',
                value_norm: phoneNorm,
                is_primary: true,
                verified_at: new Date().toISOString()
            }, { onConflict: 'customer_id,type,value_norm' });
        }

        if (emailNorm) {
            await supabase.from('customer_identities').upsert({
                customer_id: customerId,
                type: 'email',
                value_norm: emailNorm,
                is_primary: true,
                verified_at: new Date().toISOString()
            }, { onConflict: 'customer_id,type,value_norm' });
        }

        return { status: 'success' };
    } catch (err) {
        reportError(err as Error, { context: 'updateAdminCustomer' });
        return { status: 'error', message: 'Ocurrió un error inesperado al actualizar' };
    }
}
