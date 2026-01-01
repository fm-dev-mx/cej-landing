// File: lib/logic/orderDispatcher.ts
// Description: Orchestrates order creation, payload mapping, and tracking side effects.

import { v4 as uuidv4 } from "uuid";
import { trackLead } from "@/lib/tracking/visitor";
import { submitLead } from "@/app/actions/submitLead";
import { reportError } from "@/lib/monitoring";
import type { CustomerInfo, OrderPayload, QuoteBreakdown, CalculatorState, CartItem } from "@/types/domain";

export type OrderSubmissionResult = {
    success: boolean;
    folio?: string;
    error?: string;
};

/**
 * Maps a quote and calculator state to a standard OrderPayload.
 */
export function mapQuoteToOrder(
    folio: string,
    customer: CustomerInfo,
    quote: QuoteBreakdown,
    draft: CalculatorState
): OrderPayload {
    const serviceLabel = quote.concreteType === 'pumped' ? 'Bomba' : 'Directo';
    const itemLabel = `Concreto ${serviceLabel} - f'c ${quote.strength}`;

    return {
        folio,
        customer,
        items: [{
            id: uuidv4(),
            label: itemLabel,
            volume: quote.volume.billedM3,
            service: quote.concreteType,
            subtotal: quote.subtotal,
            additives: draft.additives || [],
        }],
        financials: {
            subtotal: quote.subtotal,
            vat: quote.vat,
            total: quote.total,
            currency: "MXN",
        },
        breakdownLines: quote.breakdownLines,
        metadata: {
            source: "web_calculator",
            pricing_version: quote.pricingSnapshot?.rules_version || 2,
            userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server',
        },
    };
}

/**
 * Maps cart items to a standard OrderPayload (Legacy/multi-item fallback).
 */
export function mapCartToOrder(
    folio: string,
    customer: CustomerInfo,
    cart: CartItem[]
): OrderPayload {
    const totalValue = cart.reduce((acc, item) => acc + item.results.total, 0);
    const subtotalValue = cart.reduce((acc, item) => acc + item.results.subtotal, 0);
    const vatValue = cart.reduce((acc, item) => acc + item.results.vat, 0);

    return {
        folio,
        customer,
        items: cart.map((i) => ({
            id: i.id,
            label: i.config.label,
            volume: i.results.volume.billedM3,
            service: i.results.concreteType,
            subtotal: i.results.subtotal,
            additives: i.inputs.additives || [],
        })),
        financials: {
            subtotal: subtotalValue,
            vat: vatValue,
            total: totalValue,
            currency: "MXN",
        },
        metadata: {
            source: "web_calculator",
            pricing_version: 2,
            userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server',
        },
    };
}

/**
 * Dispatches an order: Persistence + Tracking.
 */
export async function dispatchOrder(
    customer: CustomerInfo,
    orderPayload: OrderPayload,
    identity: { visitorId?: string; utm_source?: string; utm_medium?: string },
    fbEventId: string
): Promise<OrderSubmissionResult> {
    try {
        // 1. Tracking (Browser side effect)
        trackLead({
            value: orderPayload.financials.total,
            currency: "MXN",
            content_name: "Order Checkout",
            event_id: fbEventId,
        });

        // 2. Persistence (Server Action)
        const result = await submitLead({
            name: customer.name,
            phone: customer.phone,
            quote: orderPayload,
            visitor_id: identity.visitorId,
            utm_source: identity.utm_source,
            utm_medium: identity.utm_medium,
            fb_event_id: fbEventId,
            privacy_accepted: true,
        });

        if (result.status === "error") {
            let msg = result.message || "Error al procesar el pedido.";
            if (result.errors) {
                const errorFields = Object.keys(result.errors).join(', ');
                msg += ` Verifique los siguientes campos: ${errorFields}`;
            }
            return {
                success: false,
                error: msg,
            };
        }

        return { success: true, folio: orderPayload.folio };
    } catch (err: unknown) {
        reportError(err, { context: "dispatchOrder.catchAll", folio: orderPayload.folio } as Record<string, unknown>);
        // Fail-open: Return success with the folio so the UI can continue to WhatsApp flow
        return { success: true, folio: orderPayload.folio };
    }
}
