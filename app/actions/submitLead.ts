// app/actions/submitLead.ts
'use server';

import { createClient } from '@supabase/supabase-js';
import { LeadSchema, type LeadData } from '@/lib/schemas';

// Initialize Supabase client for Server Environment
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
    fieldErrors?: Record<string, string[] | undefined>;
};

export async function submitLead(payload: LeadData): Promise<SubmitLeadResult> {
    // 1. Server-side Validation
    const parseResult = LeadSchema.safeParse(payload);

    if (!parseResult.success) {
        return {
            success: false,
            error: 'Datos inválidos',
            fieldErrors: parseResult.error.flatten().fieldErrors,
        };
    }

    if (!supabase) {
        console.error('SERVER ERROR: Supabase credentials missing.');
        return {
            success: false,
            error: 'Error de configuración del servidor',
        };
    }

    const data = parseResult.data;

    // Prepare JSONB data structure
    const quoteData = {
        ...data.quote,
        meta: {
            calculated_at: new Date().toISOString(),
            version: 'v2.2-server-action',
            session_id: data.session_id || null,
        },
    };

    try {
        const { data: dbData, error } = await supabase
            .from('leads')
            .insert([
                {
                    name: data.name,
                    phone: data.phone,
                    quote_data: quoteData,
                    visitor_id: data.visitor_id || null,
                    utm_source: data.utm_source || 'direct',
                    utm_medium: data.utm_medium || 'none',
                    utm_campaign: data.utm_campaign || null,
                    utm_term: data.utm_term || null,
                    utm_content: data.utm_content || null,
                    fbclid: data.fbclid || null,
                    privacy_accepted: data.privacy_accepted,
                    privacy_accepted_at: new Date().toISOString(),
                    status: 'new',
                    fb_event_id: data.fb_event_id || null,
                },
            ])
            .select('id')
            .single();

        if (error) {
            console.error('Supabase Insert Error:', error);
            return { success: false, error: 'No se pudo guardar la información.' };
        }

        return { success: true, id: String(dbData?.id) };

    } catch (err) {
        console.error('Unexpected Action Error:', err);
        return { success: false, error: 'Ocurrió un error inesperado.' };
    }
}
