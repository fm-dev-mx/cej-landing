"use client";
import { useRef, useState } from "react";
import { submitLead } from "@/app/actions/submitLead";
import type { LeadData } from "@/lib/schemas";

// Both public entry points require persistence before announcing success or tracking Lead.
export function useLeadSubmission() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  const attempt = useRef<{ fingerprint: string; eventId: string } | null>(null);
  async function submit(data: Omit<LeadData, "fb_event_id">) {
    if (locked.current) return null;
    locked.current = true;
    setPending(true);
    setError("");
    const fingerprint = JSON.stringify({
      name: data.name,
      phone: data.phone,
      quote: data.quote,
    });
    if (attempt.current?.fingerprint !== fingerprint)
      attempt.current = { fingerprint, eventId: crypto.randomUUID() };
    const eventId = attempt.current.eventId;
    try {
      const result = await submitLead({ ...data, fb_event_id: eventId });
      if (!result.success || !result.id) {
        setError(
          result.error ??
            "No se pudo guardar. Tus datos se conservan; intenta de nuevo.",
        );
        return null;
      }
      attempt.current = null;
      return { id: result.id, eventId };
    } catch {
      setError(
        "Se perdió la conexión. Conservamos tus datos; vuelve a intentar.",
      );
      return null;
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  return { submit, pending, error };
}
