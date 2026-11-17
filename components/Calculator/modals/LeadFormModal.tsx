// components/Calculator/modals/LeadFormModal.tsx
"use client";

import { useState, FormEvent, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { useIdentity } from "@/hooks/useIdentity";
import { useLeadSubmission } from "@/hooks/useLeadSubmission";
import { useCejStore } from "@/store/useCejStore";
import type { LeadData } from "@/lib/schemas";
import styles from "./LeadFormModal.module.scss";

export type LeadQuoteDetails = {
  summary: {
    total: number;
    volume: number;
    product: string;
  };
  context: Record<string, unknown>;
};

type LeadFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (name: string, fbEventId: string) => void;
  quoteDetails: LeadQuoteDetails;
};

const subscribe = () => () => {};
export function LeadFormModal(props: LeadFormModalProps) {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (!props.isOpen || !mounted) return null;
  return <LeadFormContent {...props} />;
}
function LeadFormContent({
  onClose,
  onSuccess,
  quoteDetails,
}: LeadFormModalProps) {
  const user = useCejStore((s) => s.user);
  const updateUserContact = useCejStore((s) => s.updateUserContact);
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [saveMyData, setSaveMyData] = useState(true);
  const [error, setError] = useState<{
    message: string;
    isApiError: boolean;
  } | null>(null);
  const {
    submit,
    pending: isPending,
    error: persistenceError,
  } = useLeadSubmission();
  const identity = useIdentity();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/[^0-9]/g, "");

    // Validation
    if (cleanName.length < 3) {
      setError({
        message: "Por favor ingresa tu nombre completo.",
        isApiError: false,
      });
      return;
    }
    if (cleanPhone.length < 10) {
      setError({
        message: "Ingresa un número de al menos 10 dígitos.",
        isApiError: false,
      });
      return;
    }
    if (!privacyAccepted) {
      setError({
        message: "Debes aceptar el aviso de privacidad para continuar.",
        isApiError: false,
      });
      return;
    }

    // Prepare Payload
    const payload: LeadData = {
      name: cleanName,
      phone: cleanPhone,
      quote: quoteDetails,
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

    const saved = await submit(payload);
    if (saved) {
      updateUserContact({
        name: cleanName,
        phone: cleanPhone,
        save: saveMyData,
      });
      onSuccess(cleanName, saved.eventId);
    }
  };

  return createPortal(
    <div className={styles.backdrop} onClick={isPending ? undefined : onClose}>
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
            {user.name
              ? `Hola de nuevo, ${user.name.split(" ")[0]} 👋`
              : "Casi listo 🚀"}
          </h3>
          <p className={styles.subtitle}>
            {user.name
              ? "Confirma tus datos para enviar la cotización."
              : "Compártenos tus datos para enviarte la cotización formal y confirmar disponibilidad."}
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

          {/* Phone capture */}
          <div className={styles.phoneGroup}>
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
            <p className={styles.phoneHint}>
              Sin spam. Solo para coordinar la entrega.
            </p>
          </div>

          {/* Persistence Checkbox */}
          <div className={styles.checkboxWrapper}>
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
                He leído y acepto el{" "}
                <a
                  href="/aviso-de-privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  Aviso de Privacidad
                </a>
                .
              </span>
            </label>
          </div>

          {persistenceError && (
            <p className={styles.apiError} role="alert">
              {persistenceError}
            </p>
          )}
          {error && (
            <p
              className={`${styles.errorMessage} ${error.isApiError ? styles.apiError : ""}`}
              role="alert"
            >
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
            {user.name ? "Enviar Pedido" : "Continuar a WhatsApp"}
          </Button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
