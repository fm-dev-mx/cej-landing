// app/api/track-contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { sendToMetaCAPI } from "@/lib/tracking/capi";
import { env } from "@/config/env";
import { reportError } from "@/lib/monitoring";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hashData(data: string | undefined): string | undefined {
    if (!data) return undefined;
    const normalized = data.trim().toLowerCase();
    if (!normalized) return undefined;
    return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Endpoint to track WhatsApp clicks as 'Contact' events in Meta CAPI.
 * This ensures tracking even if the browser closes immediately after the WhatsApp redirect.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { event_id } = body;

        if (!event_id) {
            return NextResponse.json({ error: "Missing event_id" }, { status: 400 });
        }

        const cookieStore = await cookies();
        const headerStore = await headers();

        const clientIp = headerStore.get("x-forwarded-for")?.split(",")[0].trim() || "0.0.0.0";
        const userAgent = headerStore.get("user-agent") || "";
        const referer = headerStore.get("referer") || env.NEXT_PUBLIC_SITE_URL;

        const fbp = cookieStore.get("_fbp")?.value;
        const fbc = cookieStore.get("_fbc")?.value;

        // Fire CAPI Contact event
        await sendToMetaCAPI({
            event_name: "Contact",
            event_time: Math.floor(Date.now() / 1000),
            event_id,
            event_source_url: referer,
            action_source: "website",
            user_data: {
                client_ip_address: clientIp,
                client_user_agent: userAgent,
                fbp,
                fbc,
            },
            custom_data: {
                content_name: "WhatsApp Click",
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        reportError(error, { source: "track-contact-api" });
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
