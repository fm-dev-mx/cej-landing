import { profileSchema, type Company } from "./schemas";

/**
 * Business facts the owner has not supplied yet. The system keeps working
 * without them: each one is shown as «pendiente» with its reason, and no flow
 * fills the gap with an invented value.
 */
export type PendingKey =
  | "company_profile"
  | "validity_conditions"
  | "freight_tax"
  | "meta_destination"
  | "source_totals";

export interface PendingItem {
  key: PendingKey;
  label: string;
  reason: string;
  effect: string;
}

export interface MarketingDestinationState {
  dataset_id: string | null;
  api_version: string | null;
  verified: boolean;
  enabled: boolean;
}

/** Control totals the owner confirms for a corrected source workbook. */
export interface SourceTotals {
  orders: number;
  volume: number;
  total: number;
}

export interface PendingInput {
  company: Pick<
    Company,
    "quote_profile" | "profile_verified" | "freight_tax" | "freight_vat_rate"
  > | null;
  destination?: MarketingDestinationState | null;
  sourceTotals?: SourceTotals | null;
}

const LABELS: Record<PendingKey, string> = {
  company_profile: "Perfil empresarial real",
  validity_conditions: "Vigencia y condiciones comerciales",
  freight_tax: "IVA del flete de Samalayuca ($1,500 por camión)",
  meta_destination: "Destino y elegibilidad de Meta",
  source_totals: "Totales de control del Excel fuente",
};

const item = (key: PendingKey, reason: string, effect: string) => ({
  key,
  label: LABELS[key],
  reason,
  effect,
});

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};

const fieldOk = (
  profile: Record<string, unknown>,
  field: keyof typeof profileSchema.shape,
) => profileSchema.shape[field].safeParse(profile[field]).success;

export function pendingData(input: PendingInput): PendingItem[] {
  const out: PendingItem[] = [];
  const company = input.company;
  const profile = record(company?.quote_profile);
  const verified = company?.profile_verified === true;

  const identityMissing = (["name", "tax_id", "address", "contact"] as const)
    .filter((f) => !fieldOk(profile, f));
  if (!company || identityMissing.length || !verified)
    out.push(
      item(
        "company_profile",
        !company
          ? "No hay empresa configurada."
          : identityMissing.length
            ? `Falta validar: ${identityMissing.map(fieldName).join(", ")}.`
            : "Los datos capturados no están marcados como validados por el propietario.",
        "Las cotizaciones formales salen como borrador no autorizado; las genéricas siguen disponibles.",
      ),
    );

  const terms = ["conditions", "validity_days"] as const;
  const termsMissing = company
    ? terms.filter((f) => !fieldOk(profile, f))
    : [...terms];
  if (!company || termsMissing.length || !verified)
    out.push(
      item(
        "validity_conditions",
        termsMissing.length
          ? `Falta validar: ${termsMissing.map(fieldName).join(", ")}.`
          : "La vigencia y las condiciones no están marcadas como validadas por el propietario.",
        "Los documentos no muestran fecha de vigencia ni condiciones; se marcan como pendientes.",
      ),
    );

  if (!company?.freight_tax || company.freight_vat_rate === null)
    out.push(
      item(
        "freight_tax",
        !company?.freight_tax
          ? "No está confirmado si la tarifa de $1,500 por camión incluye IVA o si se suma."
          : "Falta la tasa de IVA confirmada del flete.",
        "Las cotizaciones con flete a Samalayuca muestran total provisional y quedan como borrador no autorizado.",
      ),
    );

  const d = input.destination ?? null;
  if (!d || !d.dataset_id || !d.api_version || !d.verified || !d.enabled)
    out.push(
      item(
        "meta_destination",
        !d || !d.dataset_id || !d.api_version
          ? "No hay destino de ensayo (dataset y versión de API) registrado para la empresa."
          : !d.verified
            ? "El destino de ensayo no está verificado."
            : "El destino de ensayo está deshabilitado.",
        "Las solicitudes y ventas se guardan localmente con su elegibilidad pendiente; no se envía nada a Meta.",
      ),
    );

  const t = input.sourceTotals ?? null;
  if (
    !t ||
    ![t.orders, t.volume, t.total].every((n) => Number.isFinite(n) && n >= 0)
  )
    out.push(
      item(
        "source_totals",
        "No hay totales de control confirmados del Excel fuente corregido.",
        "La importación y la promoción de filas siguen disponibles, pero la conciliación no se certifica.",
      ),
    );
  return out;
}

const FIELD_NAMES: Record<keyof typeof profileSchema.shape, string> = {
  name: "nombre o razón social",
  tax_id: "RFC",
  address: "domicilio",
  contact: "contacto comercial",
  conditions: "condiciones",
  validity_days: "vigencia en días",
};
function fieldName(f: keyof typeof profileSchema.shape) {
  return FIELD_NAMES[f];
}

/** Pending facts that affect one stored quote, read from its own snapshot. */
export function snapshotPending(s: {
  formal_ready?: boolean;
  valid_until?: string | null;
  conditions?: string | null;
  pending_tax?: boolean;
  freight?: unknown;
}): PendingItem[] {
  const out: PendingItem[] = [];
  if (!s.formal_ready)
    out.push(
      item(
        "company_profile",
        "El emisor no tenía datos empresariales validados al crear esta revisión.",
        "Documento no válido como cotización formal.",
      ),
    );
  if (!s.valid_until || !s.conditions)
    out.push(
      item(
        "validity_conditions",
        "La vigencia y las condiciones no estaban validadas al crear esta revisión.",
        "Sin fecha de vigencia ni condiciones comerciales.",
      ),
    );
  if (s.freight && s.pending_tax)
    out.push(
      item(
        "freight_tax",
        "No estaba confirmado si los $1,500 por camión incluyen IVA.",
        "El total es provisional.",
      ),
    );
  return out;
}

export const pendingLine = (p: PendingItem) =>
  `Pendiente · ${p.label}: ${p.reason}`;
