// File: app/actions/submitLead.ts
// Description: Server action to persist a lead into Supabase and send data to Meta CAPI.
// Optimized for strict error boundaries and strong typing.

"use server";

import { createClient } from "@supabase/supabase-js";
import { headers, cookies } from "next/headers";
import { after } from "next/server";
import { createHash } from "node:crypto";

import {
    OrderSubmissionSchema,
    // Note: We prefer the strict domain type for the payload structure
    // to ensure TS safety beyond the Zod schema.
} from "@/lib/schemas";
import type { OrderPayload } from "@/types/domain"; // Import strict type
import { env } from "@/config/env";
import { reportError, reportWarning } from "@/lib/monitoring";
import type { Database, QuoteSnapshot, Json } from "@/types/database";
import { sendToMetaCAPI } from "@/lib/tracking/capi";
import { getAttributionData, extractAttribution } from "@/lib/logic/attribution";

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

export type SubmitLeadResult =
    | {
        status: "success";
        id: string;
        warning?: "db_not_configured" | "db_insert_failed" | "server_exception";
    }
    | {
        status: "error";
        message: string;
        errors?: Record<string, string[]>;
    };

/**
 * normalizePhone
 * Strips non-digits and ensures '52' prefix for Mexico.
 * Meta CAPI expects international format without '+' or leading zeros.
 */
function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    // Strict Mexico E.164: 52 + 10 digits
    if (digits.length === 12 && digits.startsWith("52")) return digits;
    if (digits.length === 10) return `52${digits}`;
    return digits;
}

/**
 * hashData
 * Helper to normalize and SHA-256 hash PII for Meta CAPI compliance.
 */
function hashData(data: string | undefined, isPhone = false): string | undefined {
    if (!data) return undefined;
    let normalized = data.trim().toLowerCase();

    if (isPhone) {
        const digits = normalized.replace(/\D/g, "");
        // Strict Mexico E.164: 52 + 10 digits.
        // If it doesn't match, we return undefined to avoid sending poor data to Meta.
        if (digits.length === 12 && digits.startsWith("52")) {
            normalized = digits;
        } else if (digits.length === 10) {
            normalized = `52${digits}`;
        } else {
            return undefined;
        }
    }

    if (!normalized) return undefined;
    return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Definition of the input payload using strictly typed OrderPayload for the quote.
 * Exported to allow type-safe testing.
 */
export type SubmitLeadPayload = {
    name: string;
    phone: string;
    quote: OrderPayload; // Enforce strict type here
    visitor_id?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    fbclid?: string;
    gclid?: string;
    fb_event_id?: string;
    privacy_accepted: boolean;
};

export async function submitLead(
    payload: SubmitLeadPayload
): Promise<SubmitLeadResult> {
    try {
        // 1. Validate payload with Zod for runtime safety
        const parseResult = OrderSubmissionSchema.safeParse(payload);

        if (!parseResult.success) {
            const validationErrors = parseResult.error.flatten();
            return {
                status: "error",
                message: "Datos de pedido inválidos o incompletos.",
                errors: validationErrors.fieldErrors,
            };
        }

        // Destructure safely from the parsed data
        const {
            name,
            phone,
            quote,
            visitor_id,
            fb_event_id,
            privacy_accepted,
        } = parseResult.data;

        // No more manual casting! Zod verification guarantees OrderPayload compatibility.
        const typedQuote = quote;

        const headerStore = await headers();
        const cookieStore = await cookies();

        const clientIp = headerStore.get("x-forwarded-for")?.split(",")[0].trim() || headerStore.get("x-real-ip") || undefined;
        const userAgent = headerStore.get("user-agent") || "";
        const refererUrl = headerStore.get("referer") || env.NEXT_PUBLIC_SITE_URL;

        const fbp = cookieStore.get("_fbp")?.value;
        const fbc = cookieStore.get("_fbc")?.value;

        // 2. Fail-open behavior if DB is not configured
        if (!supabase) {
            reportWarning("SUPABASE_NOT_CONFIGURED: Lead not saved to DB.", { phone });
            return {
                status: "success",
                id: "mock-no-db",
                warning: "db_not_configured",
            };
        }

        const attribution = await getAttributionData(extractAttribution(parseResult.data));

        const now = new Date().toISOString();

        // Snapshot for JSONB storage in leads.quote_data
        // Now includes breakdownLines for exact display fidelity on shared quote page
        const quoteSnapshot: QuoteSnapshot = {
            folio: typedQuote.folio,
            items: typedQuote.items,
            financials: typedQuote.financials,
            breakdownLines: typedQuote.breakdownLines,
            metadata: typedQuote.metadata,
            customer: {
                name,
                phone,
                visitorId: visitor_id,
            },
        };

        // 2.5 Rate Limiting: Max 5 submissions per 5 minutes per visitor or phone
        if (supabase) {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const phone_norm = normalizePhone(phone);
            let filterString = `phone_norm.eq.${phone_norm}`;
            if (visitor_id) {
                filterString = `visitor_id.eq.${visitor_id},${filterString}`;
            }

            const { count, error: countError } = await supabase
                .from("leads")
                .select("*", { count: "exact", head: true })
                .or(filterString)
                .gte("created_at", fiveMinutesAgo);

            if (!countError && count && count >= 5) {
                return {
                    status: "error",
                    message: "Has realizado demasiadas solicitudes recientemente. Por favor, espera unos minutos e intenta de nuevo.",
                };
            }
        }

        // 3. Insert into leads table
        const insertData: Database['public']['Tables']['leads']['Insert'] = {
            name,
            phone,
            phone_norm: normalizePhone(phone),
            quote_data: quoteSnapshot as unknown as Json,
            visitor_id: visitor_id || null,
            fb_event_id: fb_event_id || null,
            utm_source: attribution.utm_source ?? null,
            utm_medium: attribution.utm_medium ?? null,
            utm_campaign: attribution.utm_campaign ?? null,
            utm_term: attribution.utm_term ?? null,
            utm_content: attribution.utm_content ?? null,
            fbclid: attribution.fbclid ?? null,
            gclid: attribution.gclid ?? null,
            status: "new",
            privacy_accepted,
            privacy_accepted_at: privacy_accepted ? now : null,
        };

        const { data, error } = await supabase
            .from("leads")
            .insert(insertData)
            .select("id")
            .single();

        if (error || !data) {
            const msg = error?.message ?? "No data returned";
            reportError(new Error(`Supabase Insert Failed: ${msg}`), {
                code: error?.code,
                details: error?.details,
                payloadPhone: phone,
            });

            // Fail-open: Return success to UI so the user sees the "Order Received" page
            return {
                status: "success",
                id: "fallback-db-error",
                warning: "db_insert_failed",
            };
        }

        // 4. Fire Meta CAPI event asynchronously
        // Always fires, generating a fallback event_id if needed
        after(async () => {
            const hashedPhone = hashData(phone, true);
            const hashedEmail = hashData(typedQuote.customer?.email);
            const finalEventId = fb_event_id || `lead_${data.id}_${Date.now()}`;

            await sendToMetaCAPI({
                event_name: "Lead",
                event_time: Math.floor(Date.now() / 1000),
                event_id: finalEventId,
                event_source_url: refererUrl,
                action_source: "website",
                user_data: {
                    client_ip_address: clientIp,
                    client_user_agent: userAgent,
                    ph: hashedPhone,
                    em: hashedEmail,
                    fbp,
                    fbc,
                    external_id: hashData(visitor_id),
                    fn: hashData(name.trim().split(/\s+/)[0]),
                },
                custom_data: {
                    currency: typedQuote.financials.currency,
                    value: typedQuote.financials.total,
                    content_name: "Concrete Quote",
                    status: "new",
                    contents: typedQuote.items.map((item) => ({
                        id: item.id,
                        quantity: item.volume,
                        item_price: item.subtotal,
                    })),
                },
            });
        });

        return { status: "success", id: String(data.id) };

    } catch (err: unknown) {
        // Global Catch-All: Ensures the server never crashes the client request
        reportError(err instanceof Error ? err : new Error("Unknown error"), {
            context: "submitLead unhandled exception"
        });

        return {
            status: "error",
            message: "Ocurrió un error inesperado al procesar su solicitud. Por favor, intente más tarde.",
        };
    }
}
