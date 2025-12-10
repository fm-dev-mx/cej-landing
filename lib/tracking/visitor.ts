// File: lib/tracking/visitor.ts
// Description: Client-side wrapper for Facebook Pixel interaction.

import { env } from '@/config/env';

// Extend Window to support the Facebook Pixel function
declare global {
    interface Window {
        fbq?: Fbq;
    }
}

type Fbq = {
    (action: 'init', id: string): void;
    (action: 'track', event: string, params?: Record<string, unknown>, options?: { eventID: string }): void;
};

export const FB_PIXEL_ID = env.NEXT_PUBLIC_PIXEL_ID;

const hasFbq = (): boolean =>
    typeof window !== 'undefined' && typeof window.fbq === 'function';

/**
 * PageView – use it on route changes.
 */
export const trackPageView = (): void => {
    if (!hasFbq()) return;
    window.fbq?.('track', 'PageView');
};

/**
 * ViewContent – for example when the user sees the calculator result.
 */
export const trackViewContent = (
    value: number,
    currency: string = 'MXN',
    contentName?: string,
): void => {
    if (!hasFbq()) return;

    window.fbq?.('track', 'ViewContent', {
        value,
        currency,
        content_name: contentName,
    });
};

type LeadData = {
    value: number;
    currency: string;
    content_name: string;
    content_category?: string;
    event_id?: string;
};

/**
 * Lead – high value event.
 * Uses 'eventID' option specifically for deduplication with CAPI.
 */
export const trackLead = ({
    value,
    currency,
    content_name,
    content_category = 'Quote',
    event_id,
}: LeadData): void => {
    if (!hasFbq()) return;

    const payload: Record<string, unknown> = {
        value,
        currency,
        content_name,
        content_category,
    };

    // Correct Pixel Syntax: 4th argument is options object with eventID
    if (event_id) {
        window.fbq?.('track', 'Lead', payload, { eventID: event_id });
    } else {
        window.fbq?.('track', 'Lead', payload);
    }
};

export type ContactMethod = 'WhatsApp' | 'Phone' | 'Email' | 'whatsapp' | 'phone' | 'email';

/**
 * Contact – mid/low value contact intent event.
 * It is sent with a normalized `method` parameter (lowercase).
 */
export const trackContact = (method: ContactMethod): void => {
    if (!hasFbq()) return;

    const normalized = method.toLowerCase() as 'whatsapp' | 'phone' | 'email';

    window.fbq?.('track', 'Contact', {
        content_name: normalized,
        method: normalized,
    });
};
