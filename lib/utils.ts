// lib/utils.ts
import { type CartItem, type QuoteBreakdown } from '@/types/domain'; // Ensure this path matches your structure

export const clamp = (v: number, min: number, max: number): number =>
    Math.min(Math.max(v, min), max);

export function fmtMXN(value: number): string {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export const parseNum = (s: string | number | undefined): number => {
    const n = Number(String(s || '0').replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : 0;
};

/**
 * Generates a simple, human-readable Quote ID (Folio).
 * Format: WEB-YYYYMMDD-XXXX (where XXXX is a random suffix)
 */
export function generateQuoteId(): string {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);

    return `WEB-${datePart}-${randomPart}`;
}

/**
 * Generates a sanitized WhatsApp URL with the MX country code (52).
 * @param phone Raw phone number from env vars
 * @param text Optional pre-filled message
 */
export function getWhatsAppUrl(
    phone: string | undefined,
    text: string = ''
): string | undefined {
    if (!phone) return undefined;

    // Remove all non-numeric characters
    let cleanNumber = phone.replace(/\D/g, '');

    // Safety: ensure reasonable length for a phone number
    if (cleanNumber.length < 10) return undefined;

    // Logic for MX numbers:
    // - If it's exactly 10 digits, prepend 52.
    // - If it has 12 digits and starts with 52, assume it's already formatted.
    if (cleanNumber.length === 10) {
        cleanNumber = `52${cleanNumber}`;
    }

    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates a sanitized 'tel:' URI for calling.
 * @param phone Raw phone number
 */
export function getPhoneUrl(
    phone: string | undefined
): string | undefined {
    if (!phone) return undefined;

    // Allow digits and '+' sign only for international calls
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (!cleanPhone) return undefined;

    return `tel:${cleanPhone}`;
}

/**
 * Helper to format cart for WhatsApp using strict types.
 */
export function generateCartMessage(
    cart: CartItem[],
    name: string,
    folio: string
): string {
    let message = `👋 Hola, soy *${name}*, me interesa confirmar este pedido (Folio: ${folio}):\n\n`;

    cart.forEach((item, index) => {
        const { results, config } = item;
        const concreteType = results.concreteType;
        const volume = results.volume?.billedM3;
        const strength = results.strength;

        const specs = strength ? `f'c ${strength}` : '';
        message += `🔹 *Ítem ${index + 1}:* ${config?.label || 'Concreto'} ${specs}\n`;

        if (volume) {
            message += `   • Volumen: ${Number(volume).toFixed(2)} m³\n`;
        }

        if (concreteType) {
            message += `   • Servicio: ${concreteType === 'pumped' ? 'Bomba' : 'Tiro Directo'}\n`;
        }

        message += `   • Subtotal: ${fmtMXN(results.total)}\n\n`;
    });

    const grandTotal = cart.reduce(
        (acc, item) => acc + item.results.total,
        0
    );

    message += `💰 *TOTAL ESTIMADO: ${fmtMXN(grandTotal)}*\n`;
    message += `📍 *Ubicación de entrega:* (Por favor comparte tu ubicación)`;

    return message;
}
/**
 * Generates a simple message for a single quote (no registration).
 */
export function buildDirectQuoteMessage(
    quote: QuoteBreakdown
): string {
    const volume = quote.volume?.billedM3;
    const concreteType = quote.concreteType;
    const strength = quote.strength;

    let message = `👋 Hola, me interesa una cotización de concreto:\n\n`;

    if (strength) message += `🔹 *Tipo:* f'c ${strength}\n`;
    if (volume) message += `   • *Volumen:* ${volume.toFixed(2)} m³\n`;
    if (concreteType) message += `   • *Servicio:* ${concreteType === 'pumped' ? 'Bomba' : 'Tiro Directo'}\n`;

    if (quote.total) {
        message += `💰 *Total Estimado:* ${fmtMXN(quote.total)}\n`;
    }

    message += `\n📍 *Ubicación del colado:* (Comparte tu ubicación aquí)`;

    return message;
}
