// components/Calculator/modals/LeadFormModal.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { useIdentity } from '@/hooks/useIdentity';
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Tracking identity
    const identity = useIdentity();

    // Ensure we only render the portal on the client side
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

        // Validation
        if (cleanName.length < 3) {
            setError('Por favor ingresa tu nombre completo.');
            return;
        }
        if (cleanPhone.length < 10) {
            setError('Ingresa un número de al menos 10 dígitos.');
            return;
        }
        if (!privacyAccepted) {
            setError('Debes aceptar el aviso de privacidad para continuar.');
            return;
        }

        setIsSubmitting(true);

        // Generate CAPI Event ID
        const fbEventId = crypto.randomUUID();

        try {
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: cleanName,
                    phone: cleanPhone,
                    quote: quoteDetails,
                    fb_event_id: fbEventId,
                    // Identity & Consent Data
                    visitor_id: identity?.visitorId || null,
                    session_id: identity?.sessionId || null,
                    privacy_accepted: true,
                }),
            });

            if (!response.ok) {
                // Try to parse error message from server
                const resData = await response.json().catch(() => ({}));
                throw new Error(resData.error || 'Error al guardar los datos.');
            }

            // Success: Trigger parent callback
            onSuccess(cleanName, fbEventId);

        } catch (err) {
            console.error(err);
            // Fallback: Proceed to WhatsApp even if API fails (Critical for conversion)
            // But log the error (in a real app, send to Sentry)
            onSuccess(cleanName, fbEventId);
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button
                    className={styles.closeBtn}
                    onClick={onClose}
                    aria-label="Cerrar modal"
                    type="button"
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
                    />

                    {/* Privacy Checkbox */}
                    <div className={styles.checkboxWrapper}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={privacyAccepted}
                                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                className={styles.checkbox}
                            />
                            <span>
                                He leído y acepto el <a href="/aviso-de-privacidad" target="_blank" rel="noopener noreferrer" className={styles.link}>Aviso de Privacidad</a>.
                            </span>
                        </label>
                    </div>

                    {error && (
                        <p className={styles.errorMessage} role="alert">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        variant="whatsapp"
                        fullWidth
                        isLoading={isSubmitting}
                        loadingText="Procesando..."
                    >
                        Continuar a WhatsApp
                    </Button>
                </form>
            </div>
        </div>,
        document.body
    );
}
