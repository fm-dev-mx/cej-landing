// components/Checkout/CheckoutModal.tsx
"use client";

import { useState, FormEvent, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useCejStore } from "@/store/useCejStore";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import {
  getWhatsAppUrl,
  generateCartMessage,
  generateQuoteId,
} from "@/lib/utils";
import { trackLead } from "@/lib/pixel";
import { env } from "@/config/env";
import { useLeadSubmission } from "@/hooks/useLeadSubmission";
import type { LeadData } from "@/lib/schemas";
import styles from "./CheckoutModal.module.scss";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const subscribe = () => () => {};
export default function CheckoutModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  // Server Action state
  const {
    submit,
    pending: isPending,
    error: persistenceError,
  } = useLeadSubmission();

  const cart = useCejStore((s) => s.cart);
  const user = useCejStore((s) => s.user);
  const clearCart = useCejStore((s) => s.clearCart);
  const setDrawerOpen = useCejStore((s) => s.setDrawerOpen);

  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/[^0-9]/g, "");

    if (cleanName.length < 3 || cleanPhone.length < 10) {
      setError("Por favor revisa tu nombre y teléfono.");
      return;
    }

    const totalValue = cart.reduce((acc, item) => acc + item.results.total, 0);
    const folio = generateQuoteId();

    // Prepare Payload
    const payload: LeadData = {
      name: cleanName,
      phone: cleanPhone,
      quote: { items: cart, total: totalValue }, // Cart Payload
      visitor_id: user.visitorId,
      privacy_accepted: true,
    };

    const saved = await submit(payload);
    if (!saved) return;
    // Track the persisted customer request.
    // 2. Track Event
    trackLead({
      value: totalValue,
      currency: "MXN",
      content_name: "Cart Checkout",
      content_category: "Order",
      event_id: saved.eventId,
    });

    // 3. Open WhatsApp
    const message = generateCartMessage(cart, cleanName, folio);
    const waUrl = getWhatsAppUrl(env.NEXT_PUBLIC_WHATSAPP_NUMBER, message);

    if (waUrl) window.open(waUrl, "_blank");

    // 4. Cleanup UI
    clearCart();
    setDrawerOpen(false);
    onClose();
  };

  return createPortal(
    <div className={styles.backdrop} onClick={isPending ? undefined : onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          disabled={isPending}
          aria-label="Cerrar solicitud"
        >
          &times;
        </button>

        <h3 className={styles.title}>Solicitar cotización</h3>
        <p className={styles.text}>
          Ingresa tus datos para consultar precio y disponibilidad por WhatsApp.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Nombre"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isPending}
          />
          <Input
            label="Teléfono"
            type="tel"
            placeholder="656..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            disabled={isPending}
          />

          {(error || persistenceError) && (
            <p className={styles.error} role="alert">
              {error || persistenceError}
            </p>
          )}

          <div className={styles.legal}>
            <label>
              <input type="checkbox" required disabled={isPending} />
              <span>Acepto el aviso de privacidad</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="whatsapp"
            fullWidth
            isLoading={isPending}
            loadingText="Procesando..."
            disabled={isPending}
          >
            Enviar Pedido
          </Button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
