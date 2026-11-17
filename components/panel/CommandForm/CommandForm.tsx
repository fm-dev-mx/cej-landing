"use client";
import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitCommand, type ActionResult } from "@/app/panel/actions";
import styles from "./CommandForm.module.scss";

export interface Field {
  name: string;
  label: string;
  type?:
    "text" | "number" | "datetime-local" | "checkbox" | "textarea" | "select";
  required?: boolean;
  value?: string | number;
  step?: string;
  min?: number;
  options?: { value: string; label: string }[];
  hint?: string;
}
interface Props {
  kind: string;
  payload?: Record<string, unknown>;
  fields: Field[];
  label: string;
  destination?: string;
  onSaved?: (result: ActionResult, data: Record<string, unknown>) => void;
}
export default function CommandForm({
  kind,
  payload = {},
  fields,
  label,
  destination,
  onSaved,
}: Props) {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, setPending] = useState(false);
  const locked = useRef(false);
  const router = useRouter();
  const formId = useId();
  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    setResult(null);
    const form = new FormData(event.currentTarget);
    const data: Record<string, unknown> = { kind, ...payload };
    for (const field of fields) {
      const value = String(form.get(field.name) ?? "");
      data[field.name] =
        field.type === "checkbox"
          ? form.has(field.name)
          : field.type === "number"
            ? Number(value)
            : field.type === "datetime-local" && value
              ? new Date(value).toISOString()
              : value ||
                (["source_channel", "origin"].includes(field.name)
                  ? null
                  : value);
    }
    if (kind === "configure") {
      data.profile = Object.fromEntries(
        Object.entries(data)
          .filter(([key]) => key.startsWith("profile."))
          .map(([key, value]) => [key.slice(8), value]),
      );
      for (const key of Object.keys(data))
        if (key.startsWith("profile.")) delete data[key];
      if (!form.get("freight_tax")) data.freight_tax = null;
      if (!form.get("freight_vat_rate")) data.freight_vat_rate = null;
    }
    if (kind === "followup" && !data.project_id) delete data.project_id;
    if (kind === "complete_followup" && !data.next_due_at)
      delete data.next_due_at;
    try {
      const response = await submitCommand(data);
      setResult(response);
      if (response.ok) {
        onSaved?.(response, data);
        if (destination)
          router.push(destination.replace(":id", response.id ?? ""));
        router.refresh();
      }
    } catch {
      setResult({
        ok: false,
        message:
          "Se perdió la conexión. Tus campos se conservan; revisa antes de reintentar.",
      });
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  return (
    <form className={styles.form} onSubmit={send}>
      {fields.map((field) => (
        <label className={styles.field} key={field.name}>
          <span id={`${formId}-${field.name}-label`}>{field.label}</span>
          {field.type === "select" ? (
            <select
              aria-labelledby={`${formId}-${field.name}-label`}
              aria-invalid={Boolean(result?.fields?.[field.name])}
              aria-describedby={
                result?.fields?.[field.name]
                  ? `${formId}-${field.name}-error`
                  : undefined
              }
              name={field.name}
              required={field.required}
              defaultValue={field.value ?? ""}
            >
              {!field.required && (
                <option value="">Desconocido / sin dato</option>
              )}
              {field.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : field.type === "textarea" ? (
            <textarea
              aria-labelledby={`${formId}-${field.name}-label`}
              aria-invalid={Boolean(result?.fields?.[field.name])}
              aria-describedby={
                result?.fields?.[field.name]
                  ? `${formId}-${field.name}-error`
                  : undefined
              }
              name={field.name}
              required={field.required}
              defaultValue={field.value}
            />
          ) : (
            <input
              aria-labelledby={`${formId}-${field.name}-label`}
              aria-invalid={Boolean(result?.fields?.[field.name])}
              aria-describedby={
                result?.fields?.[field.name]
                  ? `${formId}-${field.name}-error`
                  : undefined
              }
              name={field.name}
              type={field.type ?? "text"}
              required={field.required}
              defaultValue={field.value}
              min={field.min}
              step={field.step}
            />
          )}
          {field.hint && <small>{field.hint}</small>}
          {result?.fields?.[field.name] && (
            <small id={`${formId}-${field.name}-error`} role="alert">
              {result.fields[field.name]}
            </small>
          )}
        </label>
      ))}
      <button disabled={pending} type="submit">
        {pending ? "Guardando…" : label}
      </button>
      {result && <p role={result.ok ? "status" : "alert"}>{result.message}</p>}
    </form>
  );
}
