// lib/tracking/identity.ts

import { getCookie, setCookie } from '@/lib/cookies';

const VISITOR_COOKIE_KEY = 'cej_visitor_id';
const SESSION_STORAGE_KEY = 'cej_session_id';

export type IdentityData = {
    visitorId: string;
    sessionId: string;
};

/**
 * Retrieves or generates a persistent Visitor ID (cookie-based).
 * Expires in 365 days.
 */
export const getOrInitVisitorId = (): string => {
    if (typeof window === 'undefined') return '';

    let vid = getCookie(VISITOR_COOKIE_KEY);
    if (!vid) {
        vid = crypto.randomUUID();
        setCookie(VISITOR_COOKIE_KEY, vid, { expires: 365, sameSite: 'Lax' });
    }
    return vid;
};

/**
 * Retrieves or generates a Session ID (sessionStorage-based).
 * Resets when the tab/browser is closed.
 */
export const getOrInitSessionId = (): string => {
    if (typeof window === 'undefined') return '';

    try {
        let sid = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!sid) {
            sid = crypto.randomUUID();
            window.sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
        }
        return sid;
    } catch {
        return crypto.randomUUID();
    }
};

export const getIdentityParams = (): IdentityData => ({
    visitorId: getOrInitVisitorId(),
    sessionId: getOrInitSessionId(),
});
