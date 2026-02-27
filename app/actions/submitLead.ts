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
import type { Database, QuoteSnapshot } from "@/types/database";
import { sendToMetaCAPI } from "@/lib/tracking/capi";

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
 * hashData
 * Helper to normalize and SHA-256 hash PII for Meta CAPI compliance.
 */
function hashData(data: string | undefined): string | undefined {
    if (!data) return undefined;
    const normalized = data.trim().toLowerCase();
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
            utm_source,
            utm_medium,
            fb_event_id,
            privacy_accepted,
        } = parseResult.data;

        // No more manual casting! Zod verification guarantees OrderPayload compatibility.
        const typedQuote = quote;

        const headerStore = await headers();
        const cookieStore = await cookies();

        const clientIp = headerStore.get("x-forwarded-for")?.split(",")[0].trim() || "0.0.0.0";
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

        // 3. Insert into leads table
        const { data, error } = await supabase
            .from("leads")
            .insert({
                name,
                phone,
                quote_data: quoteSnapshot,
                visitor_id: visitor_id || null,
                fb_event_id: fb_event_id || null,
                utm_source: utm_source || "direct",
                utm_medium: utm_medium || "none",
                status: "new",
                privacy_accepted,
                privacy_accepted_at: privacy_accepted ? now : null,
            })
            .select("id")
            .single();

        if (error) {
            reportError(new Error(`Supabase Insert Failed: ${error.message}`), {
                code: error.code,
                details: error.details,
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
        // Using 'after' allows the response to return immediately while CAPI sends in background
        if (fb_event_id) {
            after(async () => {
                const hashedPhone = hashData(phone);
                const hashedEmail = hashData(typedQuote.customer?.email);

                await sendToMetaCAPI({
                    event_name: "Lead",
                    event_time: Math.floor(Date.now() / 1000),
                    event_id: fb_event_id,
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
                        fn: hashData(name.split(' ')[0]),
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
        }

        return { status: "success", id: String(data.id) };

    } catch (err: unknown) {
        // Global Catch-All: Ensures the server never crashes the client request
        reportError(err instanceof Error ? err : new Error("Unknown error"), {
            context: "submitLead unhandled exception"
        });

        return {
            status: "success",
            id: "fallback-exception",
            warning: "server_exception",
        };
    }
}
