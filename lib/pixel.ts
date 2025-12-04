// lib/pixel.ts
import { env } from '@/config/env';

// Extend the Window interface to support the Facebook Pixel function
declare global {
    interface Window {
        fbq?: Fbq;
    }
}

interface Fbq {
    (event: 'init', pixelId: string): void;
    (event: 'track', eventName: string, params?: Record<string, unknown>): void;
    (event: 'trackCustom', eventName: string, params?: Record<string, unknown>): void;
}

export const FB_PIXEL_ID = env.NEXT_PUBLIC_PIXEL_ID;

/**
 * Trigger the PageView event.
 * Should be called on route changes.
 */
export const trackPageView = (): void => {
    if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'PageView');
    }
};

/**
 * Trigger the ViewContent event.
 * Used when a user calculates a quote (sees the content).
 */
export const trackViewContent = (
    value: number,
    currency: string = 'MXN',
    contentName?: string
): void => {
    if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'ViewContent', {
            value,
            currency,
            content_name: contentName,
        });
    }
};

/**
 * Trigger the Lead event (High Value).
 * Strictly for confirmed intent (e.g., clicking WhatsApp on Summary).
 */
type LeadData = {
    value: number;
    currency: string;
    content_name: string;
    content_category?: string;
};

export const trackLead = ({
    value,
    currency,
    content_name,
    content_category = 'Quote'
}: LeadData): void => {
    if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead', {
            value,
            currency,
            content_name,
            content_category,
        });
    }
};

/**
 * Trigger the Contact event (Mid/Low Value).
 * Used for generic contact buttons (Header, Footer, Sticky Bar).
 */
export const trackContact = (contactMethod: 'WhatsApp' | 'Phone' | 'Email'): void => {
    if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Contact', {
            content_name: contactMethod,
        });
    }
};
