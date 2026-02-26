// File: hooks/useCheckoutUI.ts
// Description: UI-oriented checkout hook for processing quote -> order -> WhatsApp.
// Optimized for testability and fail-safe URL generation.

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { useCejStore } from "@/store/useCejStore";
import { useIdentity } from "@/hooks/useIdentity";
import { generateQuoteId } from "@/lib/utils";
import { reportError } from "@/lib/monitoring";

import type { CustomerInfo, OrderPayload, QuoteBreakdown } from "@/types/domain";

import { dispatchOrder, mapQuoteToOrder, mapCartToOrder } from "@/lib/logic/orderDispatcher";

// CONSTANT: Exported for synchronization (used in tests)
export const WHATSAPP_DELAY_MS = 100;

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
    const draft = useCejStore((s) => s.draft);
    const updateUserContact = useCejStore((s) => s.updateUserContact);
    const identity = useIdentity();

    const processOrder = async (
        customer: CustomerInfo,
        saveContact: boolean,
        quote?: QuoteBreakdown
    ): Promise<{ success: boolean; folio?: string }> => {
        setState({ isProcessing: true, error: null });

        try {
            const folio = generateQuoteId();
            const fbEventId = uuidv4();

            // 1. Build Payload
            let orderPayload: OrderPayload;

            if (quote) {
                orderPayload = mapQuoteToOrder(folio, customer, quote, draft);
            } else {
                // Legacy / Cart Fallback - use centralized mapper
                orderPayload = mapCartToOrder(folio, customer, cart);
            }

            // 2. Persist user contact to store (UI side effect)
            updateUserContact({
                name: customer.name,
                phone: customer.phone,
                save: saveContact,
            });

            // 3. Dispatch (Persistence + Tracking)
            const result = await dispatchOrder(customer, orderPayload, identity || {}, fbEventId);

            if (!result.success) {
                // If it's a validation error (e.g. server-side Zod check), show it to user
                reportError(new Error(result.error), { context: "useCheckoutUI.validationError", customerPhone: customer.phone });
                setState({ isProcessing: false, error: result.error || null });
                return { success: false };
            }

            return { success: true, folio };
        } catch (err: unknown) {
            reportError(err, { context: "useCheckoutUI.processOrder", customerPhone: customer.phone });
            console.error(`[useCheckoutUI] processOrder CAUGHT error:`, err);
            // FAIL-OPEN (Maintain resilient behavior for system/infra failures)
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
