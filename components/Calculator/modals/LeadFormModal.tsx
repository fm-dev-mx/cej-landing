// components/Calculator/modals/LeadFormModal.tsx
'use client';

import { useState, FormEvent, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { useIdentity } from '@/hooks/useIdentity';
import { submitLead } from '@/app/actions/submitLead';
import type { LeadData } from '@/lib/schemas';
import styles from './LeadFormModal.module.scss';

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
    onSuccess: (name: string, fbEventId: string) => void;
    quoteDetails: LeadQuoteDetails;
};

export function LeadFormModal({ isOpen, onClose, onSuccess, quoteDetails }: LeadFormModalProps) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    // State for local validation feedback
    const [error, setError] = useState<{ message: string; isApiError: boolean } | null>(null);

    // useTransition for Server Action loading state
    const [isPending, startTransition] = useTransition();

    // Tracking identity
    const identity = useIdentity();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        const cleanName = name.trim();
        const cleanPhone = phone.replace(/[^0-9]/g, '');

        // 1. Client-side quick validation
        if (cleanName.length < 3) {
            setError({ message: 'Por favor ingresa tu nombre completo.', isApiError: false });
            return;
        }
        if (cleanPhone.length < 10) {
            setError({ message: 'Ingresa un número de al menos 10 dígitos.', isApiError: false });
            return;
        }
        if (!privacyAccepted) {
            setError({ message: 'Debes aceptar el aviso de privacidad para continuar.', isApiError: false });
            return;
        }

        const fbEventId = crypto.randomUUID();

        // 2. Prepare Payload
        const payload: LeadData = {
            name: cleanName,
            phone: cleanPhone,
            quote: quoteDetails,
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

        // 3. Call Server Action within Transition
        startTransition(async () => {
            const result = await submitLead(payload);

            if (result.success) {
                onSuccess(cleanName, fbEventId);
            } else {
                console.error('Lead Submission Failed:', result.error);
                // Fallback: Proceed to WhatsApp to avoid losing the conversion
                onSuccess(cleanName, fbEventId);
            }
        });
    };

    return createPortal(
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button
                    className={styles.closeBtn}
                    onClick={onClose}
                    aria-label="Cerrar modal"
                    type="button"
                    disabled={isPending}
                >
                    &times;
                </button>

                <header className={styles.header}>
                    <h3 className={styles.title}>Casi listo 🚀</h3>
                    <p className={styles.subtitle}>
                        Compártenos tus datos para enviarte la cotización formal y
                        confirmar disponibilidad en tu zona.
                    </p>
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
                                checked={privacyAccepted}
                                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                className={styles.checkbox}
                                disabled={isPending}
                            />
                            <span>
                                He leído y acepto el <a href="/aviso-de-privacidad" target="_blank" rel="noopener noreferrer" className={styles.link}>Aviso de Privacidad</a>.
                            </span>
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
                        Continuar a WhatsApp
                    </Button>
                </form>
            </div>
        </div>,
        document.body
    );
}
