"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  submitCommand,
  type ActionResult,
  type ScheduleConflict,
} from "@/app/panel/actions";
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
  /** datetime-local prefill from an ISO instant, shown in the device's own time. */
  isoValue?: string | null;
  /** Rendered only after the server reports overlapping orders. */
  showOnConflict?: boolean;
}
const pad = (n: number) => String(n).padStart(2, "0");
function toLocalInput(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const juarez = (iso: string) =>
  new Date(iso).toLocaleString("es-MX", { timeZone: "America/Ciudad_Juarez" });
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
  const formRef = useRef<HTMLFormElement>(null);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  // Prefill once after mount: the server cannot know the device's time zone, and a later
  // refresh (e.g. after a concurrent edit) must not overwrite what the person typed.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    for (const field of fields) {
      const input = form.elements.namedItem(field.name);
      if (field.isoValue && input instanceof HTMLInputElement && !input.value)
        input.value = toLocalInput(field.isoValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
      if (response.conflicts?.length) setConflicts(response.conflicts);
      else if (response.ok) setConflicts([]);
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
    <form className={styles.form} onSubmit={send} ref={formRef}>
      {fields
        .filter((field) => !field.showOnConflict || conflicts.length > 0)
        .map((field) => (
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
      {conflicts.length > 0 && (
        <div role="group" aria-label="Pedidos que chocan con la ventana">
          <p>Pedidos que chocan con esta ventana:</p>
          <ul>
            {conflicts.map((c) => (
              <li key={c.id}>
                <Link href={`/panel/pedidos/${c.id}`}>{c.folio}</Link>:{" "}
                {juarez(c.start)} a {juarez(c.end)} · hora de Ciudad Juárez
              </li>
            ))}
          </ul>
        </div>
      )}
      <button disabled={pending} type="submit">
        {pending ? "Guardando…" : label}
      </button>
      {result && <p role={result.ok ? "status" : "alert"}>{result.message}</p>}
      {result?.code === "version_conflict" && (
        <button type="button" onClick={() => router.refresh()}>
          Actualizar
        </button>
      )}
    </form>
  );
}
