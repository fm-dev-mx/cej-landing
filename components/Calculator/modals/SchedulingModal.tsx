// components/Calculator/modals/SchedulingModal.tsx
"use client";

import { useState } from "react";
import { usePublicStore } from '@/store/public/usePublicStore';
import { useCheckoutUI } from "@/hooks/useCheckOutUI";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog/ResponsiveDialog";
import styles from "./SchedulingModal.module.scss";
import { getWhatsAppUrl, formatPhone } from "@/lib/utils";
import { env } from "@/config/env";
import type { QuoteBreakdown } from "@/types/domain";
import { getSchedulingErrors, isSchedulingFormValid, type SchedulingField } from "./schedulingValidation";

type SchedulingModalProps = {
    isOpen: boolean;
    onClose: () => void;
    /**
     * Optional: The current quote to submit.
     * If provided, ensures DB matches what user sees (single-item flow).
     * If omitted, falls back to cart-based submission (multi-item flow from drawer).
     */
    quote?: QuoteBreakdown | null;
    onSuccess?: (folio: string, name: string) => void;
};

export function SchedulingModal({
    isOpen,
    onClose,
    quote,
    onSuccess,
}: SchedulingModalProps) {
    const user = usePublicStore((s) => s.user);
    const { processOrder, isProcessing, error } = useCheckoutUI();

    // Form State
    const [name, setName] = useState(user.name || "");
    const [phone, setPhone] = useState(user.phone || "");
    const [address, setAddress] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [notes, setNotes] = useState("");

    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [saveMyData] = useState(true);
    const [touchedFields, setTouchedFields] = useState<Record<SchedulingField, boolean>>({
        name: false,
        phone: false,
        address: false,
        date: false,
    });
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const schedulingValues = { name, phone, address, date };
    const fieldErrors = getSchedulingErrors(schedulingValues);
    const isFormValid = isSchedulingFormValid(schedulingValues);

    const shouldShowError = (field: SchedulingField): boolean =>
        Boolean(fieldErrors[field]) && (touchedFields[field] || submitAttempted);

    const markTouched = (field: SchedulingField) => () => {
        setTouchedFields((prev) => ({ ...prev, [field]: true }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitAttempted(true);

        if (!isFormValid || !privacyAccepted) {
            return;
        }

        // Process Order (Backend + Pixel)
        const result = await processOrder(
            { name, phone },
            saveMyData,
            quote ?? undefined
        );

        // FAIL-OPEN STRATEGY:
        // Even if the backend/tracking fails (no folio), we MUST allow the user to proceed to WhatsApp.
        const finalFolio = result.folio || `OFFLINE-${Date.now().toString().slice(-6)}`;

        // 2. Clear quote and show success UI
        if (onSuccess) onSuccess(finalFolio, name);

        // 3. Open WhatsApp
        const message = `👋 Hola, soy *${name}*.
Quiero programar un pedido.
📄 Folio Cotización: *${finalFolio}*

📅 Fecha: ${date}
⏰ Horario: ${time || 'Por definir'}
📍 Dirección: ${address}
📝 Notas: ${notes || 'N/A'}

📱 Mi teléfono: ${phone}`;

        const whaUrl = getWhatsAppUrl(env.NEXT_PUBLIC_WHATSAPP_NUMBER, message);
        window.open(whaUrl, '_blank');

        // 4. Close
        onClose();
    };

    const isSubmitDisabled = !privacyAccepted || !isFormValid || isProcessing;

    return (
        <ResponsiveDialog
            isOpen={isOpen}
            onClose={onClose}
            title="Programar Pedido"
        >
            <form
                className={styles.form}
                onSubmit={handleSubmit}
                key={isOpen ? "open" : "closed"}
            >
                <p className={styles.subtitle}>
                    Completa los detalles para agendar tu entrega.
                </p>

                {/* Contact Info */}
                <div className={styles.gridRow}>
                    <Input
                        label="Nombre quien recibe"
                        placeholder="Ej. Juan Pérez"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={markTouched("name")}
                        variant="light"
                        error={shouldShowError("name") ? fieldErrors.name ?? false : false}
                        required
                        disabled={isProcessing}
                    />
                    <Input
                        label="Teléfono de contacto"
                        type="tel"
                        inputMode="numeric"
                        placeholder="656 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        onBlur={markTouched("phone")}
                        maxLength={12} // 10 digits + 2 spaces
                        disabled={isProcessing}
                        variant="light"
                        error={shouldShowError("phone") ? fieldErrors.phone ?? false : false}
                        required
                    />
                </div>

                {/* Logistics */}
                <Input
                    label="Dirección de entrega"
                    placeholder="Calle, Número, Colonia, Referencias"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onBlur={markTouched("address")}
                    required={true}
                    variant="light"
                    error={shouldShowError("address") ? fieldErrors.address ?? false : false}
                    disabled={isProcessing}
                />

                <div className={styles.gridRow}>
                    <Input
                        label="Fecha requerida"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        onBlur={markTouched("date")}
                        aria-label="fecha-entrega"
                        disabled={isProcessing}
                        required
                        variant="light"
                        error={shouldShowError("date") ? fieldErrors.date ?? false : false}
                    />
                    <Input
                        label="Preferencia horario"
                        placeholder="Ej. 8:00 AM"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        disabled={isProcessing}
                        variant="light"
                    />
                </div>

                <Input
                    label="Notas / Maniobras especiales"
                    placeholder="Ej. Cables bajos, acceso difícil..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    variant="light"
                    disabled={isProcessing}
                />

                {/* Consent */}
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
                            Acepto el{" "}
                            <a href="/aviso-de-privacidad" target="_blank">Aviso de Privacidad</a>.
                        </span>
                    </label>
                </div>

                {error && (
                    <div className={styles.errorMessage} role="alert">
                        {error}
                    </div>
                )}

                <div className={styles.actions}>
                    <Button
                        type="submit"
                        variant="whatsapp"
                        fullWidth
                        isLoading={isProcessing}
                        loadingText="Abriendo WhatsApp..."
                        disabled={isSubmitDisabled}
                    >
                        Generar Pedido en WhatsApp
                    </Button>

                    <Button
                        type="button"
                        variant="tertiary"
                        fullWidth
                        onClick={onClose}
                        disabled={isProcessing}
                        className={styles.cancelBtn}
                    >
                        Cancelar
                    </Button>

                    <p className={styles.privacyNote}>
                        🔒 Tus datos están protegidos y solo se utilizarán para coordinar esta entrega.
                    </p>
                </div>
            </form>
        </ResponsiveDialog>
    );
}
