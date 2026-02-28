// lib/tracking/capi-deadletters.server.ts
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { reportError } from "@/lib/monitoring";
import type { CapiEvent } from "@/types/tracking";

type CapiDeadLetterPayload = CapiEvent & {
    error_message?: string;
};

/**
 * SQL MIGRATION REQUIRED:
 *
 * create table if not exists public.capi_dead_letters (
 *   id uuid primary key default gen_random_uuid(),
 *   event_id text not null,
 *   event_name text not null,
 *   payload jsonb not null,
 *   error_message text,
 *   created_at timestamptz default now()
 * );
 *
 * -- Enable RLS
 * alter table public.capi_dead_letters enable row level security;
 *
 * -- Only allow service_role to insert/read
 * create policy "Service role full access" on public.capi_dead_letters
 *   for all to service_role using (true) with check (true);
 */

export async function insertDeadLetter(payload: CapiDeadLetterPayload, errorMessage?: string): Promise<void> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("[CAPI DLQ] Missing Supabase Service Role configuration");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { error } = await supabase.from("capi_dead_letters").insert({
            event_id: payload.event_id,
            event_name: payload.event_name,
            payload,
            error_message: errorMessage
        });

        if (error) throw error;
        console.warn(`[CAPI DLQ] Persisted failed event: ${payload.event_id}`);
    } catch (error) {
        // Fail-open: if dead letter insertion fails, log but don't crash
        reportError(error, { source: "CAPI-DLQ", eventId: payload.event_id });
    }
}
