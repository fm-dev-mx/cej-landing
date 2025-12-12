// components/Calculator/modals/LeadFormModal.tsx
"use client";

import { useState } from "react";
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

    // Initial state derived directly from store.
    // The form component will be reset via the 'key' prop when isOpen changes.
    const [name, setName] = useState(user.name || "");
    const [phone, setPhone] = useState(user.phone || "");
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [saveMyData, setSaveMyData] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Pass the data to the checkout hook
        // Pass the data to the checkout hook
        const result = await processOrder(
            { name, phone },
            saveMyData
        );

        if (result.success) {
            const finalFolio = result.folio || "WEB-NEW";
            if (onSuccess) onSuccess(finalFolio, name);
        }
    };

    const isSubmitDisabled =
        !privacyAccepted || name.trim().length < 3 || phone.trim().length < 10;

    return (
        <ResponsiveDialog
            isOpen={isOpen}
            onClose={onClose}
            title="Finalizar Cotización"
        >
            {/* Optimization: The 'key' prop ensures this form is fully re-mounted
                whenever the modal opens. This automatically resets the state
                (name, phone) using the latest values from the store, eliminating
                the need for a synchronization useEffect.
            */}
            <form
                className={styles.form}
                onSubmit={handleSubmit}
                data-testid="lead-form"
                key={isOpen ? "open" : "closed"}
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
