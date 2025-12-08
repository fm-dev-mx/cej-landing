import { env } from '@/config/env';
import { reportError } from '@/lib/monitoring';

const API_VERSION = 'v19.0';
// Fail-safe URL construction if PIXEL_ID is missing in dev
const PIXEL_ID = env.NEXT_PUBLIC_PIXEL_ID || 'MISSING_PIXEL_ID';
const URL = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

type CapiUserData = {
    em?: string; // Hashed Email
    ph?: string; // Hashed Phone
    client_ip_address: string;
    client_user_agent: string;
    fbc?: string;
    fbp?: string;
};

type CapiEvent = {
    event_name: string;
    event_time: number;
    event_id: string;
    event_source_url: string;
    action_source: 'website';
    user_data: CapiUserData;
    custom_data?: Record<string, any>;
};

export async function sendToMetaCAPI(payload: CapiEvent) {
    // 1. Silent skip if not configured (Local Dev)
    if (!env.FB_ACCESS_TOKEN) {
        if (process.env.NODE_ENV === 'development') {
            console.log('[CAPI Dev] Skipped (No Token):', payload.event_name);
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
