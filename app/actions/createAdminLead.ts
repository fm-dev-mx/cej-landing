'use server';

import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';
import { adminLeadPayloadSchema } from '@/lib/schemas/internal/lead';
import type { AdminLeadPayload } from '@/lib/schemas/internal/lead';
import { reportError } from '@/lib/monitoring';
import type { DatabaseRowLeads } from '@/types/db/crm';

export type CreateAdminLeadResult =
    | { status: 'success'; id: number; data: DatabaseRowLeads }
    | { status: 'error'; message: string };

function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('52')) return digits;
    if (digits.length === 10) return `52${digits}`;
    return digits;
}

export async function createAdminLead(payload: AdminLeadPayload): Promise<CreateAdminLeadResult> {
    const supabase = env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
        ? createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
            auth: { persistSession: false },
        })
        : null;

    if (!supabase) {
        return { status: 'error', message: 'Base de datos no configurada' };
    }

    const parsed = adminLeadPayloadSchema.safeParse(payload);
    if (!parsed.success) {
        return { status: 'error', message: 'Datos inválidos' };
    }

    const data = parsed.data;
    const phone_norm = normalizePhone(data.phone);

    try {
        const { data: insertedData, error } = await supabase
            .from('leads')
            .insert({
                name: data.name,
                phone: data.phone,
                phone_norm,
                delivery_date: data.delivery_date || null,
                delivery_address: data.delivery_address || null,
                notes: data.notes || null,
                status: data.status || 'new',
                privacy_accepted: true,
                privacy_accepted_at: new Date().toISOString(),
                // Empty quote data since it's an admin lead without public quote details
                quote_data: { type: 'admin_manual_entry' }
            })
            .select('*')
            .single();

        if (error || !insertedData) {
            return { status: 'error', message: error?.message || 'Error al guardar el lead' };
        }

        return { status: 'success', id: insertedData.id, data: insertedData as DatabaseRowLeads };
    } catch (err) {
        reportError(err as Error, { context: 'createAdminLead' });
        return { status: 'error', message: 'Ocurrió un error inesperado' };
    }
}
