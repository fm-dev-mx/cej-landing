// components/Calculator/modals/LeadFormModal.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import styles from './LeadFormModal.module.scss';

type LeadFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (name: string) => void;
    // Update: Allow a richer and more flexible object structure
    quoteDetails: Record<string, any>;
};

export function LeadFormModal({ isOpen, onClose, onSuccess, quoteDetails }: LeadFormModalProps) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

        // Client Validation
        if (cleanName.length < 3) {
            setError('Por favor ingresa tu nombre completo.');
            return;
        }
        if (cleanPhone.length < 10) {
            setError('Ingresa un número de al menos 10 dígitos.');
            return;
        }

        setIsSubmitting(true);

        try {
            // Send to Data Layer
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: cleanName,
                    phone: cleanPhone,
                    // Send the enriched object
                    quote: quoteDetails
                }),
            });

            if (!response.ok) {
                // Optional: Read actual server error if needed
                throw new Error('Error saving lead data.');
            }

            // Success: Trigger parent callback
            onSuccess(cleanName);

        } catch (err) {
            console.error(err);
            // Fallback: Allow user to proceed to WhatsApp even if save fails
            // to avoid losing the sale due to technical issues.
            onSuccess(cleanName);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Use Portal to break out of the parent form DOM hierarchy
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

                    {error && (
                        <p style={{ color: 'var(--c-error-text)', fontSize: '0.875rem' }}>
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

                <p className={styles.legalNotice}>
                    Al continuar, aceptas nuestro <a href="/aviso-de-privacidad" target="_blank">Aviso de Privacidad</a>.
                    Tus datos están protegidos.
                </p>
            </div>
        </div>,
        document.body
    );
}
