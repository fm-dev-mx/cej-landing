'use server';

import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';
import { updateAdminLeadSchema } from '@/lib/schemas/internal/lead';
import type { UpdateAdminLeadPayload } from '@/lib/schemas/internal/lead';
import { reportError } from '@/lib/monitoring';

export type UpdateAdminLeadResult =
    | { status: 'success' }
    | { status: 'error'; message: string };

function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('52')) return digits;
    if (digits.length === 10) return `52${digits}`;
    return digits;
}

export async function updateAdminLead(payload: UpdateAdminLeadPayload): Promise<UpdateAdminLeadResult> {
    const supabase = env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
        ? createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
            auth: { persistSession: false },
        })
        : null;

    if (!supabase) {
        return { status: 'error', message: 'Base de datos no configurada' };
    }

    const parsed = updateAdminLeadSchema.safeParse(payload);
    if (!parsed.success) {
        return { status: 'error', message: 'Datos inválidos' };
    }

    const data = parsed.data;
    const { leadId, ...updates } = data;

    // Remove undefined values to not overwrite with null accidentally
    const payloadToUpdate: Record<string, string | number | boolean | null> = {};
    if (updates.name !== undefined) payloadToUpdate.name = updates.name;
    if (updates.phone !== undefined) {
        payloadToUpdate.phone = updates.phone;
        payloadToUpdate.phone_norm = normalizePhone(updates.phone);
    }
    if (updates.status !== undefined) payloadToUpdate.status = updates.status;
    if (updates.delivery_address !== undefined) payloadToUpdate.delivery_address = updates.delivery_address;
    if (updates.delivery_date !== undefined) payloadToUpdate.delivery_date = updates.delivery_date;
    if (updates.notes !== undefined) payloadToUpdate.notes = updates.notes;
    if (updates.lost_reason !== undefined) payloadToUpdate.lost_reason = updates.lost_reason;

    try {
        const { error } = await supabase
            .from('leads')
            .update(payloadToUpdate)
            .eq('id', leadId);

        if (error) {
            return { status: 'error', message: error.message || 'Error al actualizar' };
        }

        return { status: 'success' };
    } catch (err) {
        reportError(err as Error, { context: 'updateAdminLead' });
        return { status: 'error', message: 'Ocurrió un error inesperado' };
    }
}
