'use client';

import { useEffect } from 'react';
import Cookies from 'js-cookie';

const UTM_COOKIE_KEY = 'cej_utm_data';
const ATTRIBUTION_EXPIRES_DAYS = 30;

export type UtmData = {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
    timestamp?: string;
};

/**
 * Hook to capture and persist UTM parameters from the URL.
 * Also manages the visitor and session IDs via identity.ts.
 */
export function useAttribution() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const searchParams = new URLSearchParams(window.location.search);
        const utmSource = searchParams.get('utm_source');

        if (utmSource) {
            const utmData: UtmData = {
                source: utmSource,
                medium: searchParams.get('utm_medium') || undefined,
                campaign: searchParams.get('utm_campaign') || undefined,
                term: searchParams.get('utm_term') || undefined,
                content: searchParams.get('utm_content') || undefined,
                timestamp: new Date().toISOString(),
            };

            // Persist UTM data in a cookie for 30 days
            Cookies.set(UTM_COOKIE_KEY, JSON.stringify(utmData), {
                expires: ATTRIBUTION_EXPIRES_DAYS,
                sameSite: 'Lax'
            });
        }
    }, []);

    return {
        getStoredUtm: (): UtmData | null => {
            const stored = Cookies.get(UTM_COOKIE_KEY);
            if (!stored) return null;
            try {
                return JSON.parse(stored);
            } catch {
                return null;
            }
        }
    };
}
