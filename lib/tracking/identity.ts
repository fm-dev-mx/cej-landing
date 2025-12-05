// lib/tracking/identity.ts
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';

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
    let vid = Cookies.get(VISITOR_COOKIE_KEY);
    if (!vid) {
        vid = uuidv4();
        Cookies.set(VISITOR_COOKIE_KEY, vid, { expires: 365, sameSite: 'Lax' });
    }
    return vid;
};

/**
 * Retrieves or generates a Session ID (sessionStorage-based).
 * Resets when the tab/browser is closed.
 */
export const getOrInitSessionId = (): string => {
    if (typeof window === 'undefined') return '';

    let sid = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sid) {
        sid = uuidv4();
        window.sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
    }
    return sid;
};

export const getIdentityParams = (): IdentityData => ({
    visitorId: getOrInitVisitorId(),
    sessionId: getOrInitSessionId(),
});
