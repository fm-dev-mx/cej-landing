// File: components/Calculator/modals/LeadFormModal.tsx
// Description: Modal to capture customer data and trigger the checkout flow.

"use client";

import { useEffect, useState } from "react";
import { useCejStore } from "@/store/useCejStore";
import { useCheckoutUI } from "@/hooks/useCheckOutUI";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog/ResponsiveDialog";
import styles from "./LeadFormModal.module.scss";

type LeadFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (folio: string, name: string) => void;
};

export function LeadFormModal({
    isOpen,
    onClose,
    onSuccess,
}: LeadFormModalProps) {
    const user = useCejStore((s) => s.user);
    const { processOrder, isProcessing, error } = useCheckoutUI();

    const [name, setName] = useState(user.name || "");
    const [phone, setPhone] = useState(user.phone || "");
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [saveMyData, setSaveMyData] = useState(true);

    // Prefill when modal opens and user data is available
    useEffect(() => {
        if (isOpen && user.name) setName(user.name);
        if (isOpen && user.phone) setPhone(user.phone);
    }, [isOpen, user.name, user.phone]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Pass the data to the checkout hook
        const success = await processOrder(
            { name, phone },
            saveMyData
        );

        if (success) {
            // Use a placeholder or the actual response if processOrder returned the folio
            const tempFolio = "WEB-NEW";
            if (onSuccess) onSuccess(tempFolio, name);
        }
    };

    const isSubmitDisabled =
        !privacyAccepted || name.length < 3 || phone.length < 10;

    return (
        <ResponsiveDialog
            isOpen={isOpen}
            onClose={onClose}
            title="Finalizar Cotización"
        >
            <form
                className={styles.form}
                onSubmit={handleSubmit}
                data-testid="lead-form"
            >
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
                    data-testid="input-lead-name"
                />

                <Input
                    label="Teléfono Móvil"
                    type="tel"
                    inputMode="numeric"
                    placeholder="656 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={10}
                    variant="light"
                    required
                    disabled={isProcessing}
                    autoComplete="tel"
                    data-testid="input-lead-phone"
                />

                <div className={styles.checkboxWrapper}>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={privacyAccepted}
                            onChange={(e) => setPrivacyAccepted(e.target.checked)}
                            required
                            disabled={isProcessing}
                            data-testid="checkbox-privacy"
                        />
                        <span>
                            Acepto el{" "}
                            <a
                                href="/aviso-de-privacidad"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Aviso de Privacidad
                            </a>{" "}
                            y autorizo el contacto vía WhatsApp.
                        </span>
                    </label>
                </div>

                {/* Optional: "remember my data" checkbox (future UX) */}
                <div className={styles.checkboxWrapper}>
                    <label className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={saveMyData}
                            onChange={(e) => setSaveMyData(e.target.checked)}
                            disabled={isProcessing}
                            data-testid="checkbox-save-data"
                        />
                        <span>Recordar mis datos para futuras cotizaciones.</span>
                    </label>
                </div>

                {error && (
                    <div className={styles.errorMessage} role="alert" data-testid="form-error">
                        {error}
                    </div>
                )}

                <div className={styles.actions}>
                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        isLoading={isProcessing}
                        loadingText="Generando..."
                        disabled={isSubmitDisabled}
                        data-testid="btn-submit-lead"
                    >
                        Generar Ticket
                    </Button>
                </div>
            </form>
        </ResponsiveDialog>
    );
}
