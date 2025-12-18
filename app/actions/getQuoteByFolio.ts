// app/actions/getQuoteByFolio.ts
// Description: Server action to fetch and sanitize a quote by its folio human-id.
// Uses service-role to bypass RLS for reading from the leads table.

"use server";

import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";
import { reportError } from "@/lib/monitoring";
import type { Database, QuoteSnapshot } from "@/types/database";
import { FolioParamSchema } from "@/lib/schemas/orders";

// Initialize Supabase only if keys are present
const supabase =
    env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
        ? createClient<Database>(
            env.NEXT_PUBLIC_SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: { persistSession: false },
            }
        )
        : null;

/**
 * Masks a phone number for privacy: (e.g. 6561234567 -> ******4567)
 */
function maskPhone(phone: string | undefined): string {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 4) return "****";
    // Keep last 4 digits, mask the rest
    return "*".repeat(cleaned.length - 4) + cleaned.slice(-4);
}

/**
 * Fetches a quote snapshot from the leads table by its folio.
 * Sanitzes PII (phone, visitorId) before returning to client.
 */
export async function getQuoteByFolio(folio: string): Promise<QuoteSnapshot | null> {
    try {
        // 1. Validate input format
        const parseResult = FolioParamSchema.safeParse(folio);
        if (!parseResult.success) {
            return null;
        }
        const validFolio = parseResult.data;

        if (!supabase) {
            console.warn("SUPABASE_NOT_CONFIGURED: Shared quote lookup failed.");
            return null;
        }

        // 2. Query JSONB column inside leads table
        // We look for validFolio inside the quote_data JSONB object.
        const { data, error } = await supabase
            .from("leads")
            .select("quote_data")
            .eq("quote_data->>folio", validFolio)
            .limit(1)
            .maybeSingle();

        if (error) {
            reportError(new Error(`Supabase Query Failed: ${error.message}`), {
                context: "getQuoteByFolio",
                folio: validFolio
            });
            return null;
        }

        if (!data) return null;

        // Cast to our domain type
        const snapshot = data.quote_data as QuoteSnapshot;

        // 3. Sanitize data (Mask PII for public sharing)
        const sanitizedSnapshot: QuoteSnapshot = {
            ...snapshot,
            customer: snapshot.customer ? {
                ...snapshot.customer,
                phone: maskPhone(snapshot.customer.phone),
                visitorId: undefined, // Strip internal ID
            } : undefined
        };

        return sanitizedSnapshot;

    } catch (err: unknown) {
        reportError(err instanceof Error ? err : new Error("Unknown error"), {
            context: "getQuoteByFolio catch-all",
            folio
        });
        return null;
    }
}
