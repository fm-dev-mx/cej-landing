// app/actions/submitLead.ts
'use server';

import { createClient } from '@supabase/supabase-js';
import { OrderSubmissionSchema, type OrderSubmission } from '@/lib/schemas';
import { env } from '@/config/env';

// Initialize Supabase only if keys are present to allow build/dev without them
const supabase =
    env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
        ? createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                persistSession: false // Server actions don't need persistent session
            }
        })
        : null;

export type SubmitLeadResult = {
    success: boolean;
    id?: string;
    error?: string;
    warning?: string; // New field for Fail-Open feedback
};

export async function submitLead(payload: OrderSubmission): Promise<SubmitLeadResult> {
    // 1. Validation
    const parseResult = OrderSubmissionSchema.safeParse(payload);

    if (!parseResult.success) {
        console.error('Validation Error:', parseResult.error.flatten());
        return { success: false, error: 'Datos de pedido inválidos.' };
    }

    const { name, phone, quote, visitor_id, utm_source, utm_medium, fb_event_id } = parseResult.data;

    // 2. Fail-Open Infrastructure Check
    if (!supabase) {
        console.warn('SUPABASE_NOT_CONFIGURED: Lead was not saved to DB (Dev Mode or Missing Keys).');
        // Return success so the user can still proceed to WhatsApp
        return { success: true, id: 'mock-dev-id', warning: 'db_not_configured' };
    }

    try {
        // 3. Database Insertion
        // We map the incoming payload to the 'leads' table columns
        const { data: dbData, error } = await supabase
            .from('leads')
            .insert([
                {
                    name,
                    phone,
                    quote_data: quote, // Stores the full JSONB snapshot (Audit Trail)
                    visitor_id: visitor_id || null,
                    utm_source: utm_source || 'direct',
                    utm_medium: utm_medium || 'none',
                    status: 'new',
                    fb_event_id: fb_event_id || null,
                    // created_at is handled by DB default
                },
            ])
            .select('id')
            .single();

        if (error) {
            console.error('CRITICAL: Supabase Insert Error:', error);
            // Fail-Open Strategy: Return success but log the error internally
            // In a real production app, we might fire an alert to Sentry here
            return {
                success: true,
                id: 'fallback-id',
                warning: 'db_insert_failed'
            };
        }

        return { success: true, id: String(dbData?.id) };

    } catch (err) {
        console.error('UNHANDLED EXCEPTION in submitLead:', err);
        // Fail-Open Strategy
        return {
            success: true,
            id: 'fallback-exception',
            warning: 'server_exception'
        };
    }
}
