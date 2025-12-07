'use client';

import { useState, FormEvent, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { useIdentity } from '@/hooks/useIdentity';
import { submitLead } from '@/app/actions/submitLead';
import { useCejStore } from '@/store/useCejStore';
import type { LeadData } from '@/lib/schemas';
import { generateQuoteId, getWhatsAppUrl, generateCartMessage } from '@/lib/utils';
import { trackLead, trackContact } from '@/lib/pixel';
import { env } from '@/config/env';
import styles from './LeadFormModal.module.scss';

export type ModalMode = 'lead' | 'checkout';

export type LeadQuoteDetails = {
    summary: {
        total: number;
        volume: number;
        product: string;
    };
    context: Record<string, any>;
};

type LeadFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    mode: ModalMode;
    // For Single Lead Mode
    quoteDetails?: LeadQuoteDetails;
    onSuccessLead?: (name: string, fbEventId: string) => void;
};

export function LeadFormModal({
    isOpen,
    onClose,
    mode,
    quoteDetails,
    onSuccessLead
}: LeadFormModalProps) {
    // Local State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [saveMyData, setSaveMyData] = useState(true);
    const [error, setError] = useState<{ message: string; isApiError: boolean } | null>(null);
    const [mounted, setMounted] = useState(false);

    // Store & Hooks
    const user = useCejStore(s => s.user);
    const updateUserContact = useCejStore(s => s.updateUserContact);
    const cart = useCejStore(s => s.cart);
    const clearCart = useCejStore(s => s.clearCart);
    const setDrawerOpen = useCejStore(s => s.setDrawerOpen);

    const [isPending, startTransition] = useTransition();
    const identity = useIdentity();

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Pre-fill
    useEffect(() => {
        if (isOpen && user.name && user.phone) {
            setName(user.name);
            setPhone(user.phone);
            setPrivacyAccepted(true);
        }
    }, [isOpen, user.name, user.phone]);

    if (!isOpen || !mounted) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        const cleanName = name.trim();
        const cleanPhone = phone.replace(/[^0-9]/g, '');

        if (cleanName.length < 3 || cleanPhone.length < 10) {
            setError({ message: 'Verifica tu nombre y teléfono (10 dígitos).', isApiError: false });
            return;
        }
        if (!privacyAccepted) {
            setError({ message: 'Acepta el aviso de privacidad.', isApiError: false });
            return;
        }

        const fbEventId = crypto.randomUUID();
        const folio = generateQuoteId();

        // Determine Payload based on Mode
        let payloadQuoteData: any = {};
        let totalValue = 0;

        if (mode === 'checkout') {
            totalValue = cart.reduce((acc, item) => acc + item.results.total, 0);
            payloadQuoteData = { items: cart, total: totalValue, type: 'full_order' };
        } else {
            // Single Lead
            payloadQuoteData = quoteDetails;
            totalValue = quoteDetails?.summary.total || 0;
        }

        const payload: LeadData = {
            name: cleanName,
            phone: cleanPhone,
            quote: payloadQuoteData,
            fb_event_id: fbEventId,
            privacy_accepted: true,
            visitor_id: identity?.visitorId,
            session_id: identity?.sessionId,
            utm_source: identity?.utm_source,
            utm_medium: identity?.utm_medium,
            utm_campaign: identity?.utm_campaign,
            utm_term: identity?.utm_term,
            utm_content: identity?.utm_content,
            fbclid: identity?.fbclid,
        };

        startTransition(async () => {
            // 1. Persistence
            updateUserContact({ name: cleanName, phone: cleanPhone, save: saveMyData });

            // 2. Submit API
            await submitLead(payload);

            // 3. Tracking
            trackLead({
                value: totalValue,
                currency: 'MXN',
                content_name: mode === 'checkout' ? 'Order Checkout' : quoteDetails?.summary.product || 'Quote',
                content_category: mode === 'checkout' ? 'Order' : 'Quote',
                event_id: fbEventId
            });
            trackContact('whatsapp');

            // 4. Handle Success / Redirection
            if (mode === 'checkout') {
                const message = generateCartMessage(cart, cleanName, folio);
                const waUrl = getWhatsAppUrl(env.NEXT_PUBLIC_WHATSAPP_NUMBER, message);
                if (waUrl) window.open(waUrl, '_blank');

                clearCart();
                setDrawerOpen(false);
                onClose();
            } else {
                if (onSuccessLead) onSuccessLead(cleanName, fbEventId);
            }
        });
    };

    const title = mode === 'checkout' ? 'Confirmar Pedido' : (user.name ? `Hola de nuevo, ${user.name.split(' ')[0]}` : 'Casi listo');
    const subtitle = mode === 'checkout'
        ? 'Tus datos para enviarte la orden de compra.'
        : 'Para enviarte la cotización formal y verificar disponibilidad.';
    const buttonText = mode === 'checkout' ? 'Enviar Pedido' : 'Continuar a WhatsApp';

    return createPortal(
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose} type="button" disabled={isPending}>&times;</button>

                <header className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>
                    <p className={styles.subtitle}>{subtitle}</p>
                </header>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <Input
                        label="Nombre completo"
                        placeholder="Ej. Juan Pérez"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        variant="light"
                        required
                        disabled={isPending}
                    />

                    <Input
                        label="Teléfono / WhatsApp"
                        type="tel"
                        placeholder="656 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        maxLength={10}
                        variant="light"
                        required
                        disabled={isPending}
                    />

                    <div className={styles.checkboxWrapper}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={saveMyData}
                                onChange={(e) => setSaveMyData(e.target.checked)}
                                className={styles.checkbox}
                                disabled={isPending}
                            />
                            <span>Guardar mis datos para futuros pedidos.</span>
                        </label>
                    </div>

                    <div className={styles.checkboxWrapper}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={privacyAccepted}
                                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                className={styles.checkbox}
                                disabled={isPending}
                            />
                            <span>He leído y acepto el <a href="/aviso-de-privacidad" className={styles.link}>Aviso de Privacidad</a>.</span>
                        </label>
                    </div>

                    {error && (
                        <p className={`${styles.errorMessage} ${error.isApiError ? styles.apiError : ''}`} role="alert">
                            {error.message}
                        </p>
                    )}

                    <Button
                        type="submit"
                        variant="whatsapp"
                        fullWidth
                        isLoading={isPending}
                        loadingText="Procesando..."
                        disabled={isPending}
                    >
                        {buttonText}
                    </Button>
                </form>
            </div>
        </div>,
        document.body
    );
}
