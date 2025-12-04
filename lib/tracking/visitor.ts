// path: lib/pixel.ts
import { env } from '@/config/env';

// Extend Window to support the Facebook Pixel function
declare global {
    interface Window {
        fbq?: Fbq;
    }
}

type Fbq = {
    (action: 'init', id: string): void;
    (action: 'track', event: string, params?: Record<string, unknown>): void;
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
 *
 * NOTE: `event_id` is also stored in the DB (fb_event_id) so it can be
 * matched later with Conversion API (CAPI) events on the server.
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

    if (event_id) {
        payload.event_id = event_id;
    }

    window.fbq?.('track', 'Lead', payload);
};

export type ContactMethod =
    | 'WhatsApp'
    | 'Phone'
    | 'Email'
    | 'whatsapp'
    | 'phone'
    | 'email';

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
