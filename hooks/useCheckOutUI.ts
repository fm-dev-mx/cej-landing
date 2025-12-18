// File: hooks/useCheckoutUI.ts
// Description: UI-oriented checkout hook for processing quote -> order -> WhatsApp.
// Optimized for testability and fail-safe URL generation.

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { useCejStore } from "@/store/useCejStore";
import { useIdentity } from "@/hooks/useIdentity";
import { submitLead } from "@/app/actions/submitLead";
import { trackLead } from "@/lib/tracking/visitor";
import {
    generateQuoteId,
} from "@/lib/utils";
import { reportError } from "@/lib/monitoring";

import type { CustomerInfo, OrderPayload, QuoteBreakdown } from "@/types/domain";

type CheckoutState = {
    isProcessing: boolean;
    error: string | null;
};

// CONSTANT: Exported for testing synchronization
export const WHATSAPP_DELAY_MS = 100;

export function useCheckoutUI() {
    const [state, setState] = useState<CheckoutState>({
        isProcessing: false,
        error: null,
    });

    const cart = useCejStore((s) => s.cart);
    const draft = useCejStore((s) => s.draft);
    const updateUserContact = useCejStore((s) => s.updateUserContact);
    // Note: moveToHistory has been moved to the WhatsApp click handler
    // to fix the race condition where cart was emptied before user saw it.
    const identity = useIdentity();

    /**
     * processOrder
     *
     * - Builds a quote payload from the provided quote OR falls back to cart.
     * - Fires browser-side Pixel event with event_id.
     * - Sends server-side CAPI call through submitLead.
     * - Returns success status and generated folio for UI display.
     *
     * @param customer - Customer contact information
     * @param saveContact - Whether to persist the contact to store
     * @param quote - Optional: The QuoteBreakdown to submit (ensures consistency between local and DB).
     *                If not provided, falls back to cart-based submission (legacy behavior).
     */
    const processOrder = async (
        customer: CustomerInfo,
        saveContact: boolean,
        quote?: QuoteBreakdown
    ): Promise<{ success: boolean; folio?: string }> => {
        setState({ isProcessing: true, error: null });

        try {
            const folio = generateQuoteId();

            // 1. Generate deduplication key (event_id) for Pixel + CAPI
            // Use uuidv4 for better compatibility than crypto.randomUUID
            const fbEventId = uuidv4();

            let orderPayload: OrderPayload;

            if (quote) {
                // NEW: Single quote submission (from QuoteSummary flow)
                // This ensures exact consistency between local display and DB storage
                const serviceLabel = quote.concreteType === 'pumped' ? 'Bomba' : 'Directo';
                const itemLabel = `Concreto ${serviceLabel} - f'c ${quote.strength}`;

                orderPayload = {
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
                        userAgent: navigator.userAgent,
                    },
                };
            } else {
                // LEGACY: Cart-based submission (from QuoteDrawer flow)
                // Used when submitting multiple items at once
                const totalValue = cart.reduce((acc, item) => acc + item.results.total, 0);
                const subtotalValue = cart.reduce((acc, item) => acc + item.results.subtotal, 0);
                const vatValue = cart.reduce((acc, item) => acc + item.results.vat, 0);

                orderPayload = {
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
                    // Cart items don't have a unified breakdownLines, so omit
                    metadata: {
                        source: "web_calculator",
                        pricing_version: 2,
                        userAgent: navigator.userAgent,
                    },
                };
            }

            const totalForTracking = orderPayload.financials.total;

            // Persist user contact to store (optional)
            updateUserContact({
                name: customer.name,
                phone: customer.phone,
                save: saveContact,
            });

            // 2. Fire browser Pixel event with event_id
            trackLead({
                value: totalForTracking,
                currency: "MXN",
                content_name: "Order Checkout",
                event_id: fbEventId,
            });

            // 3. Send order snapshot to server (Supabase + CAPI)
            const result = await submitLead({
                name: customer.name,
                phone: customer.phone,
                quote: orderPayload,
                visitor_id: identity?.visitorId,
                utm_source: identity?.utm_source,
                utm_medium: identity?.utm_medium,
                fb_event_id: fbEventId,
                privacy_accepted: true,
            });

            if (result.status === "error") {
                if (result.errors) {
                    const errorFields = Object.keys(result.errors).join(', ');
                    const detailedMessage = `${result.message} Verifique los siguientes campos: ${errorFields}`;
                    throw new Error(detailedMessage, { cause: result.errors });
                }
                throw new Error(result.message || "Error al procesar el pedido.");
            }

            return { success: true, folio };
        } catch (err: unknown) {
            reportError(err, { context: "useCheckoutUI.processOrder", customerPhone: customer.phone });

            const errorMessage = err instanceof Error ? err.message : "Error al procesar el pedido.";
            const isValidationError = errorMessage.includes("Verifique los siguientes campos");

            if (isValidationError) {
                setState({
                    isProcessing: false,
                    error: errorMessage,
                });
                return { success: false };
            }

            // FAIL-OPEN
            const offlineFolio = `OFFLINE-${Date.now().toString(36).toUpperCase()}`;
            setState({
                isProcessing: false,
                error: null,
            });
            return { success: true, folio: offlineFolio };
        } finally {
            setState((prev) => ({ ...prev, isProcessing: false }));
        }
    };

    return { ...state, processOrder };
}
