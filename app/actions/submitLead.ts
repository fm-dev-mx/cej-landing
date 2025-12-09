// File: app/actions/submitLead.ts
// Description: Server action to persist a lead into Supabase and send data to Meta CAPI.

"use server";

import { createClient } from "@supabase/supabase-js";
import { headers, cookies } from "next/headers";
import { after } from "next/server";
import { createHash } from "node:crypto";

import {
    OrderSubmissionSchema,
    type OrderSubmission,
} from "@/lib/schemas";
import { env } from "@/config/env";
import { reportError, reportWarning } from "@/lib/monitoring";
import type { Database, QuoteSnapshot } from "@/types/database";
import { sendToMetaCAPI } from "@/lib/tracking/capi";

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
 *
 * - Normalizes and hashes PII for CAPI.
 */
function hashData(data: string | undefined): string | undefined {
    if (!data) return undefined;
    const normalized = data.trim().toLowerCase();
    if (!normalized) return undefined;
    return createHash("sha256").update(normalized).digest("hex");
}

export async function submitLead(
    payload: OrderSubmission
): Promise<SubmitLeadResult> {
    // 1. Validate payload with Zod
    const parseResult = OrderSubmissionSchema.safeParse(payload);

    if (!parseResult.success) {
        const validationErrors = parseResult.error.flatten();
        console.error(
            "[Action:submitLead] Validation Error:",
            validationErrors
        );

        return {
            status: "error",
            message: "Datos de pedido inválidos o incompletos.",
            errors: validationErrors.fieldErrors,
        };
    }

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

    const headerStore = await headers();
    const cookieStore = await cookies();

    const clientIp =
        headerStore.get("x-forwarded-for")?.split(",")[0].trim() ||
        "0.0.0.0";

    const userAgent = headerStore.get("user-agent") || "";
    const refererUrl =
        headerStore.get("referer") || env.NEXT_PUBLIC_SITE_URL;

    const fbp = cookieStore.get("_fbp")?.value;
    const fbc = cookieStore.get("_fbc")?.value;

    // 2. Fail-open behavior if DB is not configured
    if (!supabase) {
        reportWarning("SUPABASE_NOT_CONFIGURED: Lead not saved to DB.", {
            phone,
        });

        // We return success to not block the user flow, but strictly typed as a warning state.
        return {
            status: "success",
            id: "mock-no-db",
            warning: "db_not_configured",
        };
    }

    try {
        // Snapshot for JSONB storage in leads.quote_data
        const quoteSnapshot: QuoteSnapshot = {
            folio: quote.folio,
            items: quote.items,
            financials: quote.financials,
            metadata: quote.metadata,
            customer: {
                name,
                phone,
                visitorId: visitor_id,
            },
        };

        const now = new Date().toISOString();

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
            reportError(
                new Error(`Supabase Insert Failed: ${error.message}`),
                {
                    code: error.code,
                    details: error.details,
                    payloadPhone: phone,
                }
            );

            // Fail-open: WhatsApp flow continues, but we mark a warning
            return {
                status: "success",
                id: "fallback-db-error",
                warning: "db_insert_failed",
            };
        }

        // 4. Fire Meta CAPI event asynchronously if event_id exists
        if (fb_event_id) {
            after(async () => {
                const hashedPhone = hashData(phone);
                const hashedEmail = hashData(quote.customer?.email);

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
                    },
                    custom_data: {
                        currency: quote.financials.currency,
                        value: quote.financials.total,
                        content_name: "Concrete Quote",
                        status: "new",
                        contents: quote.items.map((item) => ({
                            id: item.id,
                            quantity: item.volume,
                            item_price: item.subtotal,
                        })),
                    },
                });
            });
        }

        return { status: "success", id: String(data.id) };
    } catch (err) {
        // Fail-open: log but keep flow going
        reportError(err, {
            context: "submitLead unhandled exception",
            phone,
        });

        return {
            status: "success",
            id: "fallback-exception",
            warning: "server_exception",
        };
    }
}
