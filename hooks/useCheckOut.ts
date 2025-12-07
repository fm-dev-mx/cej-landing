// hooks/useCheckout.ts
import { useState } from 'react';
import { useCejStore } from '@/store/useCejStore';
import { useIdentity } from '@/hooks/useIdentity';
import { submitLead } from '@/app/actions/submitLead';
import { trackLead, trackContact } from '@/lib/pixel';
import { generateQuoteId, generateCartMessage, getWhatsAppUrl } from '@/lib/utils';
import { env } from '@/config/env';
import type { CustomerInfo, OrderPayload } from '@/types/domain';

type CheckoutState = {
    isProcessing: boolean;
    error: string | null;
};

export function useCheckout() {
    const [state, setState] = useState<CheckoutState>({ isProcessing: false, error: null });

    // Store access
    const cart = useCejStore(s => s.cart);
    const updateUserContact = useCejStore(s => s.updateUserContact);
    const moveToHistory = useCejStore(s => s.moveToHistory);

    // Tracking identity
    const identity = useIdentity();

    const processOrder = async (customer: CustomerInfo, saveContact: boolean) => {
        setState({ isProcessing: true, error: null });

        try {
            // 1. Prepare Data
            const folio = generateQuoteId();
            const totalValue = cart.reduce((acc, item) => acc + item.results.total, 0);
            const fbEventId = crypto.randomUUID();

            const orderPayload: OrderPayload = {
                folio,
                customer,
                items: cart.map(i => ({
                    id: i.id,
                    label: i.config.label,
                    volume: i.results.volume.billedM3,
                    service: i.results.concreteType,
                    subtotal: i.results.total
                })),
                financials: {
                    total: totalValue,
                    currency: 'MXN'
                },
                metadata: {
                    source: 'web_calculator',
                    userAgent: navigator.userAgent
                }
            };

            // 2. Persist User (Local)
            updateUserContact({
                name: customer.name,
                phone: customer.phone,
                save: saveContact
            });

            // 3. Submit to Server
            await submitLead({
                name: customer.name,
                phone: customer.phone,
                quote: orderPayload as any, // Cast to match Zod schema expectation structure if slightly different
                visitor_id: identity?.visitorId,
                utm_source: identity?.utm_source,
                utm_medium: identity?.utm_medium,
                fb_event_id: fbEventId,
                privacy_accepted: true
            });

            // 4. Tracking
            trackLead({
                value: totalValue,
                currency: 'MXN',
                content_name: 'Order Checkout',
                event_id: fbEventId
            });
            trackContact('WhatsApp');

            // 5. Cleanup & Redirect
            moveToHistory(); // Clears cart too

            const message = generateCartMessage(cart, customer.name, folio);
            const waUrl = getWhatsAppUrl(env.NEXT_PUBLIC_WHATSAPP_NUMBER, message);

            if (waUrl) {
                window.open(waUrl, '_blank');
            }

            return true;

        } catch (err) {
            console.error(err);
            setState({ isProcessing: false, error: 'Hubo un problema. Intenta de nuevo.' });
            return false;
        } finally {
            setState(prev => ({ ...prev, isProcessing: false }));
        }
    };

    return {
        ...state,
        processOrder
    };
}
