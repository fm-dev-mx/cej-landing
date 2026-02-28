import { useMemo } from 'react';
import { getIdentityParams, type IdentityData } from '@/lib/tracking/identity';
import Cookies from 'js-cookie';
import type { UTMParams } from '@/types/tracking';

export type FullIdentityData = IdentityData & Partial<UTMParams>;

export function useIdentity(): FullIdentityData | null {
    return useMemo(() => {
        const trackingIds = getIdentityParams();

        const utmCookie = Cookies.get('cej_utm');
        let utmParams: Partial<UTMParams> = {};

        if (utmCookie) {
            try {
                const parsed = JSON.parse(utmCookie);
                utmParams = {
                    utm_source: parsed.source,
                    utm_medium: parsed.medium,
                    utm_campaign: parsed.campaign,
                    utm_term: parsed.term,
                    utm_content: parsed.content,
                };
            } catch (e) {
                console.error('Failed to parse UTM cookie', e);
            }
        }

        return {
            ...trackingIds,
            ...utmParams
        };
    }, []);
}
