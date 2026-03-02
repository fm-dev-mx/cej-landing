'use server';

import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';
import { adminCustomerPayloadSchema } from '@/lib/schemas/internal/customer';
import type { AdminCustomerPayload } from '@/lib/schemas/internal/customer';
import { reportError } from '@/lib/monitoring';

export type CreateAdminCustomerResult =
    | { status: 'success'; id: string }
    | { status: 'error'; message: string };

function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('52')) return digits;
    if (digits.length === 10) return `52${digits}`;
    return digits;
}

export async function createAdminCustomer(payload: AdminCustomerPayload): Promise<CreateAdminCustomerResult> {
    const supabase = env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
        ? createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
            auth: { persistSession: false },
        })
        : null;

    if (!supabase) {
        return { status: 'error', message: 'Base de datos no configurada' };
    }

    const parsed = adminCustomerPayloadSchema.safeParse(payload);
    if (!parsed.success) {
        return { status: 'error', message: 'Datos inválidos' };
    }

    const data = parsed.data;
    const phone_norm = normalizePhone(data.phone);
    const email_norm = data.email ? data.email.toLowerCase().trim() : null;

    try {
        const { data: insertedCustomer, error: customerError } = await supabase
            .from('customers')
            .insert({
                display_name: data.display_name,
                primary_phone_norm: phone_norm,
                primary_email_norm: email_norm || null,
                identity_status: 'verified',
                rfc: data.rfc || null,
                billing_enabled: data.billing_enabled,
                billing_regimen: data.billing_regimen || null,
                cfdi_use: data.cfdi_use || null,
                postal_code: data.postal_code || null,
                legacy_notes: data.legacy_notes || null,
            })
            .select('id')
            .single();

        if (customerError || !insertedCustomer) {
            return { status: 'error', message: customerError?.message || 'Error al crear el cliente' };
        }

        // Create phone identity
        await supabase.from('customer_identities').insert({
            customer_id: insertedCustomer.id,
            type: 'phone',
            value_norm: phone_norm,
            is_primary: true,
            verified_at: new Date().toISOString()
        });

        // Create email identity if present
        if (email_norm) {
            await supabase.from('customer_identities').insert({
                customer_id: insertedCustomer.id,
                type: 'email',
                value_norm: email_norm,
                is_primary: true,
                verified_at: new Date().toISOString()
            });
        }

        return { status: 'success', id: insertedCustomer.id };
    } catch (err) {
        reportError(err as Error, { context: 'createAdminCustomer' });
        return { status: 'error', message: 'Ocurrió un error inesperado al crear el cliente.' };
    }
}
