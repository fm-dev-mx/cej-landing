// File: hooks/useCheckoutUI.ts
// Description: UI-oriented checkout hook for processing cart -> order -> WhatsApp.
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
    // Note: moveToHistory has been moved to the WhatsApp click handler
    // to fix the race condition where cart was emptied before user saw it.
    const identity = useIdentity();

    /**
     * processOrder
     *
     * - Builds a quote payload from the current cart.
     * - Fires browser-side Pixel event with event_id.
     * - Sends server-side CAPI call through submitLead.
     * - Returns success status and generated folio for UI display.
     */
    const processOrder = async (
        customer: CustomerInfo,
        saveContact: boolean
    ): Promise<{ success: boolean; folio?: string }> => {
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

            // NOTE: trackContact and moveToHistory are NO LONGER called here.
            // These should be triggered when the user actually clicks the WhatsApp link,
            // not during order processing. This fixes the race condition where cart
            // was being emptied before the user could see it.

            // 4. Return success with the generated folio for UI display
            // The UI can now show the actual folio instead of a placeholder
            return { success: true, folio };
        } catch (err: unknown) {
            console.error("Critical error in processOrder (Fail-Open triggered):", err);

            // Distinguish between validation errors (user-facing) and network errors (fail-open)
            const errorMessage = err instanceof Error ? err.message : "Error al procesar el pedido.";
            const isValidationError = errorMessage.includes("Verifique los siguientes campos");

            if (isValidationError) {
                // Validation errors: Show to user, do NOT proceed to WhatsApp
                setState({
                    isProcessing: false,
                    error: errorMessage,
                });
                return { success: false };
            }

            // FAIL-OPEN: If Supabase/CAPI fails (network issue), still allow WhatsApp.
            // We generate a temporary offline folio to ensure the UX completion.
            const offlineFolio = `OFFLINE-${Date.now().toString(36).toUpperCase()}`;

            // We track the error internally but do not block the UI
            setState({
                isProcessing: false,
                error: null, // Clear error so UI shows successful completion
            });

            // Allow flow to continue
            return { success: true, folio: offlineFolio };
        } finally {
            setState((prev) => ({ ...prev, isProcessing: false }));
        }
    };

    return { ...state, processOrder };
}
