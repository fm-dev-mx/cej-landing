'use client';

import { useState, useEffect } from 'react';
import { useCejStore } from '@/store/useCejStore';
import { useCheckout } from '@/hooks/useCheckOut';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { ResponsiveDialog } from '@/components/ui/ResponsiveDialog/ResponsiveDialog';
import styles from './LeadFormModal.module.scss';

type LeadFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (folio: string, name: string) => void; // Callback for parent
};

export function LeadFormModal({ isOpen, onClose, onSuccess }: LeadFormModalProps) {
    const user = useCejStore(s => s.user);
    const { processOrder, isProcessing, error } = useCheckout();

    // Form State
    const [name, setName] = useState(user.name || '');
    const [phone, setPhone] = useState(user.phone || '');
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [saveMyData, setSaveMyData] = useState(true);

    // Sync store user to local state when opening
    useEffect(() => {
        if (isOpen && user.name) setName(user.name);
        if (isOpen && user.phone) setPhone(user.phone);
    }, [isOpen, user.name, user.phone]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // El hook processOrder devuelve true si todo salió bien
        const success = await processOrder({ name, phone }, saveMyData);

        if (success) {
            // Nota: processOrder ya genera el folio internamente,
            // pero para el "TicketDisplay" en el cliente, idealmente el hook debería devolver el folio.
            // Por simplicidad del sprint, asumimos éxito y pasamos datos al parent.
            // *Mejora futura: que processOrder retorne { success: true, folio: '...' }*
            const tempFolio = "WEB-NEW"; // Placeholder hasta actualizar hook
            if (onSuccess) onSuccess(tempFolio, name);
            // No cerramos inmediatamente para que el usuario vea el Ticket Full en el parent step
        }
    };

    return (
        <ResponsiveDialog
            isOpen={isOpen}
            onClose={onClose}
            title="Finalizar Cotización"
        >
            <form className={styles.form} onSubmit={handleSubmit}>
                <p className={styles.subtitle}>
                    Ingresa tus datos para generar el ticket oficial y enviarlo a planta.
                </p>

                <Input
                    label="Nombre completo"
                    placeholder="Ej. Juan Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    variant="light"
                    required
                    disabled={isProcessing}
                    autoComplete="name"
                />

                <Input
                    label="Teléfono Móvil"
                    type="tel"
                    inputMode="numeric" // Critical for mobile
                    placeholder="656 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={10}
                    variant="light"
                    required
                    disabled={isProcessing}
                    autoComplete="tel"
                />

                <div className={styles.checkboxWrapper}>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={privacyAccepted}
                            onChange={(e) => setPrivacyAccepted(e.target.checked)}
                            required
                            disabled={isProcessing}
                        />
                        <span>
                            Acepto el <a href="/aviso-de-privacidad" target="_blank">Aviso de Privacidad</a>
                            {' '}y autorizo el contacto vía WhatsApp.
                        </span>
                    </label>
                </div>

                {error && <div className={styles.errorMessage} role="alert">{error}</div>}

                <div className={styles.actions}>
                    <Button
                        type="submit"
                        variant="primary" // Yellow accent
                        fullWidth
                        isLoading={isProcessing}
                        loadingText="Generando..."
                        disabled={!privacyAccepted || name.length < 3 || phone.length < 10}
                    >
                        Generar Ticket
                    </Button>
                </div>
            </form>
        </ResponsiveDialog>
    );
}
