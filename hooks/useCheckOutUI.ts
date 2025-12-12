// File: hooks/useCheckoutUI.ts
// Description: UI-oriented checkout hook for processing cart -> order -> WhatsApp.
// Optimized for testability and fail-safe URL generation.

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { useCejStore } from "@/store/useCejStore";
import { useIdentity } from "@/hooks/useIdentity";
import { submitLead } from "@/app/actions/submitLead";
import { trackLead, trackContact } from "@/lib/tracking/visitor";
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

// CONSTANT: Exported for testing synchronization
export const WHATSAPP_DELAY_MS = 100;

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
            // Use uuidv4 for better compatibility than crypto.randomUUID
            const fbEventId = uuidv4();

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
            // Passing strongly typed payload without 'as any'
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
                // If there are validation errors, throw them with detailed messages
                if (result.errors) {
                    const errorFields = Object.keys(result.errors).join(', ');
                    const detailedMessage = `${result.message} Verifique los siguientes campos: ${errorFields}`;
                    throw new Error(detailedMessage, { cause: result.errors });
                }

                throw new Error(result.message || "Error al procesar el pedido.");
            }

            // Secondary event: contact via WhatsApp (no deduplication needed)
            trackContact("WhatsApp");

            // Move current cart to history
            moveToHistory();

            // 4. Build WhatsApp message for later use (UI will handle opening)
            // The hook no longer auto-opens WhatsApp to give user control

            return true;
        } catch (err: unknown) {
            console.error(err);

            const message = err instanceof Error
                ? err.message
                : "Hubo un problema. Por favor intenta de nuevo.";

            setState({
                isProcessing: false,
                error: message,
            });
            return false;
        } finally {
            setState((prev) => ({ ...prev, isProcessing: false }));
        }
    };

    return { ...state, processOrder };
}
