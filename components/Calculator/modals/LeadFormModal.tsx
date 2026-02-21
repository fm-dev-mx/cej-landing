// components/Calculator/modals/LeadFormModal.tsx
'use client';

import { useState, FormEvent, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { useIdentity } from '@/hooks/useIdentity';
import { submitLead } from '@/app/actions/submitLead';
import { useCejStore } from '@/store/useCejStore';
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
    // Local state
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [saveMyData, setSaveMyData] = useState(true); // Default to true (Guest-First strategy)
    const [error, setError] = useState<{ message: string; isApiError: boolean } | null>(null);
    const [mounted, setMounted] = useState(false);

    // Store & Hooks
    const user = useCejStore(s => s.user);
    const updateUserContact = useCejStore(s => s.updateUserContact);
    const [isPending, startTransition] = useTransition();
    const identity = useIdentity();

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Effect: Pre-fill data from store when modal opens
    useEffect(() => {
        if (isOpen && user.name && user.phone) {
            setName(user.name);
            setPhone(user.phone);
            // If we have data, we assume they accepted privacy previously or allow quick check
            setPrivacyAccepted(true);
        }
    }, [isOpen, user.name, user.phone]);

    if (!isOpen || !mounted) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        const cleanName = name.trim();
        const cleanPhone = phone.replace(/[^0-9]/g, '');

        // Validation
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

        // Prepare Payload
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

        startTransition(async () => {
            // 1. Update Local Store (Persistence logic)
            updateUserContact({
                name: cleanName,
                phone: cleanPhone,
                save: saveMyData
            });

            // 2. Submit to Server
            const result = await submitLead(payload);

            if (result.success) {
                onSuccess(cleanName, fbEventId);
            } else {
                console.error('Lead Submission Failed:', result.error);
                // Fallback: Proceed to WhatsApp anyway to capture the sale
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
                    <h3 className={styles.title}>
                        {user.name ? `Hola de nuevo, ${user.name.split(' ')[0]} 👋` : 'Casi listo 🚀'}
                    </h3>
                    <p className={styles.subtitle}>
                        {user.name
                            ? 'Confirma tus datos para enviar la cotización.'
                            : 'Compártenos tus datos para enviarte la cotización formal y confirmar disponibilidad.'}
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

                    {/* Phone Group with inline styles fallback for missing SCSS */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                        <p style={{
                            fontSize: '0.75rem',
                            color: 'var(--c-muted)',
                            marginTop: '0.25rem',
                            textAlign: 'right'
                        }}>
                            Sin spam. Solo para coordinar la entrega.
                        </p>
                    </div>

                    {/* Persistence Checkbox */}
                    <div className={styles.checkboxWrapper} style={{ marginTop: '0.5rem', marginBottom: '0' }}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={saveMyData}
                                onChange={(e) => setSaveMyData(e.target.checked)}
                                className={styles.checkbox}
                                disabled={isPending}
                            />
                            <span>
                                Guardar mis datos en este dispositivo para futuros pedidos.
                            </span>
                        </label>
                    </div>

                    {/* Legal Checkbox */}
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
                        {user.name ? 'Enviar Pedido' : 'Continuar a WhatsApp'}
                    </Button>
                </form>
            </div>
        </div>,
        document.body
    );
}
