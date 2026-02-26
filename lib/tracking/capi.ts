// lib/tracking/capi.ts
import { env } from '@/config/env';
import { reportError } from '@/lib/monitoring';
import type { CapiEvent } from '@/types/domain';

const API_VERSION = 'v19.0';
// Fail-safe URL construction if PIXEL_ID is missing in dev
const PIXEL_ID = env.NEXT_PUBLIC_PIXEL_ID || 'MISSING_PIXEL_ID';
const URL = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

export async function sendToMetaCAPI(payload: CapiEvent): Promise<void> {
    // 1. Silent skip if not configured (Local Dev)
    if (!env.FB_ACCESS_TOKEN) {
        if (process.env.NODE_ENV === 'development') {
            // Use safe logging in dev
            console.warn('[CAPI Dev] Skipped (No Token):', payload.event_name);
        }
        return;
    }

    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: [payload],
                access_token: env.FB_ACCESS_TOKEN,
                // test_event_code: 'TEST20662' // Uncomment for debugging in Meta Events Manager
            }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`Meta API Error: ${JSON.stringify(errorData)}`);
        }
    } catch (error) {
        // 2. Fail-Open: Log error but don't crash application flow
        reportError(error, { source: 'MetaCAPI', eventId: payload.event_id });
    }
}
