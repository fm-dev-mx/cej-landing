import { cookies } from "next/headers";
import { AttributionSchema, type AttributionData } from "../schemas/attribution";

/**
 * extractAttribution
 * Helper to extract attribution-related fields from any object.
 * Useful for mapping incoming JSON payloads or form data to the attribution domain.
 */
export function extractAttribution(source: Record<string, unknown> | null | undefined): Partial<AttributionData> {
    if (!source) return {};
    const getString = (val: unknown) => (typeof val === 'string' ? val : undefined);
    return {
        utm_source: getString(source.utm_source),
        utm_medium: getString(source.utm_medium),
        utm_campaign: getString(source.utm_campaign),
        utm_term: getString(source.utm_term),
        utm_content: getString(source.utm_content),
        fbclid: getString(source.fbclid),
        gclid: getString(source.gclid),
    };
}

/**
 * getAttributionData
 * Extracts and normalizes attribution data from cookies or provided payload.
 * Normalizes strings to lowercase and trims whitespace.
 */
export async function getAttributionData(payload?: Partial<AttributionData>): Promise<AttributionData> {
    const cookieStore = await cookies();
    const cejUtmCookie = cookieStore.get("cej_utm")?.value;
    const fbcCookie = cookieStore.get("_fbc")?.value;

    let cookieData: Partial<AttributionData> = {};
    if (cejUtmCookie) {
        try {
            const parsed = JSON.parse(cejUtmCookie);
            cookieData = {
                utm_source: parsed.source,
                utm_medium: parsed.medium,
                utm_campaign: parsed.campaign,
                utm_term: parsed.term,
                utm_content: parsed.content,
            };
        } catch {
            // Silently fail if cookie is malformed
        }
    }

    // Capture fbclid from _fbc cookie if available (format: fb.1.timestamp.fbclid)
    let fbclid = cookieData.fbclid || payload?.fbclid;
    if (!fbclid && fbcCookie) {
        const parts = fbcCookie.split('.');
        if (parts.length >= 4) {
            fbclid = parts[3];
        }
    }

    const rawData = extractAttribution({
        ...cookieData,
        ...payload,
        fbclid,
    });

    // Normalize and validate
    const normalizedData: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(rawData)) {
        if (typeof value === "string") {
            normalizedData[key] = value.trim().toLowerCase() || undefined;
        } else {
            normalizedData[key] = value as string | undefined;
        }
    }

    const result = AttributionSchema.safeParse(normalizedData);

    if (!result.success) {
        return AttributionSchema.parse({}); // Return defaults
    }

    return result.data;
}
