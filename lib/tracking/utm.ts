// path: lib/tracking/utm.ts
// Helpers to capture UTM parameters / fbclid once and persist them.

export type UTMParams = {
    utm_source: string;
    utm_medium: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    fbclid?: string;
};

const UTM_STORAGE_KEY = 'cej_utm_params_v1';

const DEFAULT_UTM: UTMParams = {
    utm_source: 'direct',
    utm_medium: 'none',
};

/**
 * Parse UTM params from the current URL.
 * Applies reasonable defaults when some values are missing.
 */
const parseFromLocation = (): UTMParams => {
    if (typeof window === 'undefined') {
        return { ...DEFAULT_UTM };
    }

    try {
        const params = new URLSearchParams(window.location.search);

        // All UTMs are optionally stored if present, otherwise default to 'direct/none'.
        const utm_source = params.get('utm_source')?.toLowerCase() ?? DEFAULT_UTM.utm_source;
        const utm_medium = params.get('utm_medium')?.toLowerCase() ?? DEFAULT_UTM.utm_medium;
        const utm_campaign = params.get('utm_campaign') ?? undefined;
        const utm_term = params.get('utm_term') ?? undefined;
        const utm_content = params.get('utm_content') ?? undefined;
        const fbclid = params.get('fbclid') ?? undefined;

        return {
            utm_source,
            utm_medium,
            utm_campaign,
            utm_term,
            utm_content,
            fbclid,
        };
    } catch {
        return { ...DEFAULT_UTM };
    }
};

/**
 * Returns the UTM params stored in localStorage or, if they do not exist yet,
 * reads them from the URL and persists them.
 */
export const getOrInitUtmParams = (): UTMParams => {
    if (typeof window === 'undefined') {
        return { ...DEFAULT_UTM };
    }

    try {
        const stored = window.localStorage.getItem(UTM_STORAGE_KEY);
        // Only return stored if it's valid JSON
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.utm_source) return parsed as UTMParams;
        }

        const fresh = parseFromLocation();
        window.localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fresh));
        return fresh;
    } catch {
        return parseFromLocation();
    }
};
