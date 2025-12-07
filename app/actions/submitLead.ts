// app/actions/submitLead.ts
'use server';

import { createClient } from '@supabase/supabase-js';
import { OrderSubmissionSchema, type OrderSubmission } from '@/lib/schemas';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
    supabaseUrl && supabaseServiceRoleKey
        ? createClient(supabaseUrl, supabaseServiceRoleKey)
        : null;

export type SubmitLeadResult = {
    success: boolean;
    id?: string;
    error?: string;
};

export async function submitLead(payload: OrderSubmission): Promise<SubmitLeadResult> {
    // 1. Validation
    const parseResult = OrderSubmissionSchema.safeParse(payload);

    if (!parseResult.success) {
        console.error('Validation Error:', parseResult.error.flatten());
        return { success: false, error: 'Datos de pedido inválidos.' };
    }

    // 2. Supabase Check (Fail-open logic for dev)
    if (!supabase) {
        console.warn('SUPABASE_NOT_CONFIGURED: Lead was not saved to DB.');
        return { success: true, id: 'mock-dev-id' };
    }

    const { name, phone, quote, visitor_id, utm_source, utm_medium, fb_event_id } = parseResult.data;

    try {
        const { data: dbData, error } = await supabase
            .from('leads')
            .insert([
                {
                    name,
                    phone,
                    quote_data: quote, // Full JSONB payload
                    visitor_id: visitor_id || null,
                    utm_source: utm_source || 'direct',
                    utm_medium: utm_medium || 'none',
                    status: 'new',
                    fb_event_id: fb_event_id || null,
                    created_at: new Date().toISOString(),
                },
            ])
            .select('id')
            .single();

        if (error) {
            console.error('Supabase Insert Error:', error);
            // We return true anyway so the user can proceed to WhatsApp
            // In a real app, we might want to queue this for retry
            return { success: false, error: 'Error al guardar, pero continuando.' };
        }

        return { success: true, id: String(dbData?.id) };

    } catch (err) {
        console.error('Unexpected Action Error:', err);
        return { success: false, error: 'Error inesperado.' };
    }
}
