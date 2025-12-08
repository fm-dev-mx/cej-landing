// hooks/useCheckOut.ts
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

    const cart = useCejStore(s => s.cart);
    const updateUserContact = useCejStore(s => s.updateUserContact);
    const moveToHistory = useCejStore(s => s.moveToHistory);
    const identity = useIdentity();

    const processOrder = async (customer: CustomerInfo, saveContact: boolean) => {
        setState({ isProcessing: true, error: null });

        try {
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
                    subtotal: i.results.total,
                    // FIX: Incluimos los aditivos en el payload JSONB
                    additives: i.inputs.additives || []
                })),
                financials: {
                    total: totalValue,
                    currency: 'MXN'
                },
                metadata: {
                    source: 'web_calculator',
                    pricing_version: 2, // Auditabilidad: Fase 2 Engine
                    userAgent: navigator.userAgent
                }
            };

            updateUserContact({
                name: customer.name,
                phone: customer.phone,
                save: saveContact
            });

            const result = await submitLead({
                name: customer.name,
                phone: customer.phone,
                quote: orderPayload as any,
                visitor_id: identity?.visitorId,
                utm_source: identity?.utm_source,
                utm_medium: identity?.utm_medium,
                fb_event_id: fbEventId,
                privacy_accepted: true
            });

            if (!result.success) {
                throw new Error(result.error || 'Error al procesar el pedido.');
            }

            trackLead({
                value: totalValue,
                currency: 'MXN',
                content_name: 'Order Checkout',
                event_id: fbEventId
            });
            trackContact('WhatsApp');

            moveToHistory();

            const message = generateCartMessage(cart, customer.name, folio);
            const waUrl = getWhatsAppUrl(env.NEXT_PUBLIC_WHATSAPP_NUMBER, message);

            if (waUrl) {
                setTimeout(() => window.open(waUrl, '_blank'), 100);
            }

            return true;

        } catch (err) {
            console.error(err);
            setState({
                isProcessing: false,
                error: 'Hubo un problema. Por favor intenta de nuevo.'
            });
            return false;
        } finally {
            setState(prev => ({ ...prev, isProcessing: false }));
        }
    };

    return { ...state, processOrder };
}
