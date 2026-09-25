// lib/cookies.ts

/**
 * Lightweight native cookie helpers.
 * Replaces `js-cookie` — only the features we actually use (get/set with expiry + SameSite).
 */

/**
 * Read a cookie value by name.
 * Returns `undefined` if the cookie does not exist.
 */
export function getCookie(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined;

    const match = document.cookie.match(
        new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
    );
    if (!match) return undefined;
    try {
        return decodeURIComponent(match[1]);
    } catch {
        return match[1];
    }
}

type SetCookieOptions = {
    /** Expiry in days */
    expires?: number;
    sameSite?: 'Strict' | 'Lax' | 'None';
    path?: string;
    secure?: boolean;
};

/**
 * Set a cookie with optional expiry (in days) and SameSite attribute.
 */
export function setCookie(
    name: string,
    value: string,
    options: SetCookieOptions = {},
): void {
    if (typeof document === 'undefined') return;

    const { expires, sameSite = 'Lax', path = '/', secure } = options;

    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=${path}; SameSite=${sameSite}`;

    if (expires) {
        const date = new Date();
        date.setTime(date.getTime() + expires * 86_400_000);
        cookie += `; expires=${date.toUTCString()}`;
    }

    const isSecure = secure ?? sameSite === 'None';
    if (isSecure) {
        cookie += '; Secure';
    }

    document.cookie = cookie;
}
