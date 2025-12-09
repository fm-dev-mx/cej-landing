// File: hooks/useCheckoutUI.ts
// Description: UI-oriented checkout hook for processing cart -> order -> WhatsApp.

import { useState } from "react";

import { useCejStore } from "@/store/useCejStore";
import { useIdentity } from "@/hooks/useIdentity";
import { submitLead } from "@/app/actions/submitLead";
import { trackLead, trackContact } from "@/lib/pixel";
import {
    generateQuoteId,
    generateCartMessage,
    getWhatsAppUrl,
} from "@/lib/utils";
import { env } from "@/config/env";

import type { CustomerInfo, OrderPayload } from "@/types/domain";

type CheckoutState = {
    isProcessing: boolean;
    error: string | null;
};

export function useCheckoutUI() {
    const [state, setState] = useState<CheckoutState>({
        isProcessing: false,
        error: null,
    });

    const cart = useCejStore((s) => s.cart);
    const updateUserContact = useCejStore((s) => s.updateUserContact);
    const moveToHistory = useCejStore((s) => s.moveToHistory);
    const identity = useIdentity();

    /**
     * processOrder
     *
     * - Builds a quote payload from the current cart.
     * - Fires browser-side Pixel event with event_id.
     * - Sends server-side CAPI call through submitLead.
     * - Opens WhatsApp with a prefilled message.
     */
    const processOrder = async (
        customer: CustomerInfo,
        saveContact: boolean
    ): Promise<boolean> => {
        setState({ isProcessing: true, error: null });

        try {
            const folio = generateQuoteId();
            const totalValue = cart.reduce(
                (acc, item) => acc + item.results.total,
                0
            );

            // 1. Generate deduplication key (event_id) for Pixel + CAPI
            const fbEventId = crypto.randomUUID();

            const orderPayload: OrderPayload = {
                folio,
                customer,
                items: cart.map((i) => ({
                    id: i.id,
                    label: i.config.label,
                    volume: i.results.volume.billedM3,
                    service: i.results.concreteType,
                    subtotal: i.results.total,
                    // Include additives inside JSONB for later audits/analytics
                    additives: i.inputs.additives || [],
                })),
                financials: {
                    total: totalValue,
                    currency: "MXN",
                },
                metadata: {
                    source: "web_calculator",
                    pricing_version: 2, // Auditability: Phase 2 engine
                    userAgent: navigator.userAgent,
                },
            };

            // Persist user contact to store (optional)
            updateUserContact({
                name: customer.name,
                phone: customer.phone,
                save: saveContact,
            });

            // 2. Fire browser Pixel event with event_id
            trackLead({
                value: totalValue,
                currency: "MXN",
                content_name: "Order Checkout",
                event_id: fbEventId,
            });

            // 3. Send order snapshot to server (Supabase + CAPI)
            const result = await submitLead({
                name: customer.name,
                phone: customer.phone,
                quote: orderPayload as any,
                visitor_id: identity?.visitorId,
                utm_source: identity?.utm_source,
                utm_medium: identity?.utm_medium,
                fb_event_id: fbEventId,
                privacy_accepted: true,
            });

            if (!result.success) {
                throw new Error(result.error || "Error al procesar el pedido.");
            }

            // Secondary event: contact via WhatsApp (no deduplication needed)
            trackContact("WhatsApp");

            // Move current cart to history
            moveToHistory();

            // 4. Build WhatsApp message + open chat
            const message = generateCartMessage(cart, customer.name, folio);
            const waUrl = getWhatsAppUrl(
                env.NEXT_PUBLIC_WHATSAPP_NUMBER,
                message
            );

            if (waUrl) {
                setTimeout(() => window.open(waUrl, "_blank"), 100);
            }

            return true;
        } catch (err) {
            console.error(err);
            setState({
                isProcessing: false,
                error: "Hubo un problema. Por favor intenta de nuevo.",
            });
            return false;
        } finally {
            // Ensure spinner is reset even if we returned earlier
            setState((prev) => ({ ...prev, isProcessing: false }));
        }
    };

    return { ...state, processOrder };
}
