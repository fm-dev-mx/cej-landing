// lib/tracking/capi.ts
import { env } from '@/config/env';
import { reportError } from '@/lib/monitoring';
import type { CapiEvent } from '@/types/domain';

const API_VERSION = 'v19.0';
const PIXEL_ID = env.NEXT_PUBLIC_PIXEL_ID || 'MISSING_PIXEL_ID';
const URL = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 5000;
const BASE_DELAY_MS = 1000;

/**
 * Sends a tracking event to Meta Conversion API with retry logic and dead-letter fallback.
 */
export async function sendToMetaCAPI(payload: CapiEvent): Promise<void> {
    // 1. Silent skip if not configured (Local Dev)
    if (!env.FB_ACCESS_TOKEN) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('[CAPI Dev] Skipped (No Token):', payload.event_name);
        }
        return;
    }

    let lastError: Error | null = null;
    let attemptsMade = 0;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        attemptsMade++;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

            if (process.env.NODE_ENV === 'development') {
                console.warn(`[CAPI] Attempt ${attemptsMade} for ${payload.event_name}`);
            }

            const res = await fetch(URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    data: [payload],
                    access_token: env.FB_ACCESS_TOKEN,
                    ...(env.META_TEST_EVENT_CODE && { test_event_code: env.META_TEST_EVENT_CODE }),
                }),
            });

            clearTimeout(timeoutId);

            if (res.ok) {
                if (process.env.NODE_ENV === 'development') {
                    console.warn(`[CAPI] Success for ${payload.event_name}`);
                }
                return;
            }

            const errorData = await res.json();
            lastError = new Error(`Meta API Error: ${JSON.stringify(errorData)}`);

            // Short-circuit on 4xx (Client errors should not be retried)
            if (res.status >= 400 && res.status < 500) {
                break;
            }
        } catch (error: unknown) {
            lastError = error instanceof Error ? error : new Error(String(error));
        }

        // Wait before retry (if not the last attempt)
        if (attempt < MAX_RETRIES) {
            const delay = BASE_DELAY_MS * Math.pow(2, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    // 2. Fail-Open & Dead Letter Fallback
    reportError(lastError, { source: 'MetaCAPI', eventId: payload.event_id, attempts: attemptsMade });

    try {
        // Dynamically import server-only module to avoid bundling service role client in browser
        const { insertDeadLetter } = await import('./capi-deadletters.server');
        await insertDeadLetter(payload, lastError?.message, attemptsMade);
    } catch (dlqError) {
        // If DLQ fails, we already reported the primary error; just log to console
        console.error('[CAPI DLQ Failed]', dlqError);
    }
}
