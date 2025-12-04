// lib/utils.ts

export const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export function fmtMXN(value: number) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export const parseNum = (s: string) => {
    const n = Number(String(s).replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : 0;
};

/**
 * Generates a sanitized WhatsApp URL with the MX country code (52).
 * @param phone Raw phone number from env vars
 * @param text Optional pre-filled message
 */
export function getWhatsAppUrl(phone: string | undefined, text: string = ""): string | undefined {
    if (!phone) return undefined;

    // Remove all non-numeric characters
    let cleanNumber = phone.replace(/\D/g, "");

    // Safety: ensure reasonable length for a phone number
    if (cleanNumber.length < 10) return undefined;

    // Logic for MX numbers:
    // If it's exactly 10 digits, prepend 52.
    // If it's 12 digits and starts with 52, assume it's already formatted.
    if (cleanNumber.length === 10) {
        cleanNumber = `52${cleanNumber}`;
    }

    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates a sanitized 'tel:' URI for calling.
 * @param phone Raw phone number
 */
export function getPhoneUrl(phone: string | undefined): string | undefined {
    if (!phone) return undefined;

    // Allow digits and '+' sign only for international calls
    const cleanPhone = phone.replace(/[^\d+]/g, "");

    if (!cleanPhone) return undefined;

    return `tel:${cleanPhone}`;
}
