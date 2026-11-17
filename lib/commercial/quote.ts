import {
  BUSINESS_INFO,
  PRICE_TABLE,
  VAT_RATE,
  getQuoteProductLabel,
} from "@/config/business";
import { calcQuote } from "@/lib/pricing";
import { pendingLine, snapshotPending } from "./pending";
import {
  profileSchema,
  quoteInputSchema,
  type Company,
  type QuoteInput,
} from "./schemas";

export const CATALOG_VERSION = "main-d294304";
export const FREIGHT_VERSION = "samalayuca-2026-11-14";
const cents = (n: number) => Math.round(n * 100);
export function calculateFreight(
  input: Pick<
    QuoteInput,
    "volume" | "capacity" | "type" | "trucks" | "truckReason" | "freightRate"
  >,
) {
  if (
    ![input.volume, input.capacity, input.freightRate].every(
      (v) => Number.isFinite(v) && v > 0,
    )
  )
    throw new Error("freight_invalid");
  const mixers = Math.ceil(input.volume / input.capacity);
  const suggested = mixers + (input.type === "pumped" ? 1 : 0);
  const effective = input.trucks ?? suggested;
  if (!Number.isInteger(effective) || effective <= 0)
    throw new Error("trucks_invalid");
  if (effective !== suggested && !input.truckReason.trim())
    throw new Error("truck_reason_required");
  return {
    mixers,
    suggested,
    effective,
    capacity: input.capacity,
    rate: input.freightRate,
    amount: cents(effective * input.freightRate) / 100,
    reason: input.truckReason,
    version: FREIGHT_VERSION,
  };
}
export interface CommercialLine {
  label: string;
  quantity: number;
  unit: string;
  amount: number;
}
export function createSnapshot(
  raw: QuoteInput,
  company: Company,
  now = new Date(),
) {
  const input = quoteInputSchema.parse(raw);
  const pricing = calcQuote(
    input.volume,
    input.strength,
    input.type,
    PRICE_TABLE,
    { hasFiber: input.hasFiber },
  );
  if (pricing.total <= 0) throw new Error("price_unavailable");
  // Pumping is included in main's pumped tariff. Never add it again.
  const fiberGross = input.hasFiber
    ? cents(
        (pricing.volume.billedM3 * (PRICE_TABLE.extras?.fibra_poly ?? 0)) / 100,
      )
    : 0;
  const lines: CommercialLine[] = [
    {
      label: `${getQuoteProductLabel(input.strength)} · ${input.type === "pumped" ? "bombeado incluido" : "tiro directo"}`,
      quantity: pricing.volume.billedM3,
      unit: "m³",
      amount: (cents(pricing.total) - fiberGross) / 100,
    },
  ];
  if (fiberGross)
    lines.push({
      label: "Fibra de polipropileno",
      quantity: pricing.volume.billedM3,
      unit: "m³",
      amount: fiberGross / 100,
    });
  const freight = input.zone === "samalayuca" ? calculateFreight(input) : null;
  const pendingTax = Boolean(
    freight && (!company.freight_tax || company.freight_vat_rate === null),
  );
  let freightGross = freight ? cents(freight.amount) : 0;
  let freightNet = freightGross;
  if (freight && !pendingTax) {
    if (company.freight_tax === "additional")
      freightGross = Math.round(freightGross * (1 + company.freight_vat_rate!));
    else
      freightNet = Math.round(freightGross / (1 + company.freight_vat_rate!));
  }
  if (freight)
    lines.push({
      label: `Flete Samalayuca${pendingTax ? " · tratamiento de IVA pendiente" : ""}`,
      quantity: freight.effective,
      unit: "camión",
      amount: freightGross / 100,
    });
  const discount = cents(input.discount);
  if (discount > cents(pricing.total))
    throw new Error("discount_exceeds_concrete");
  if (discount)
    lines.push({
      label: "Descuento en concreto y fibra · requiere autorización",
      quantity: 1,
      unit: "oferta",
      amount: -discount / 100,
    });
  const concreteGross = cents(pricing.total) - discount;
  const concreteNet = Math.round(concreteGross / (1 + VAT_RATE));
  const total = concreteGross + freightGross;
  const subtotal = concreteNet + freightNet;
  const needsApproval =
    input.discount > 0 || Boolean(freight && input.freightRate !== 1500);
  const profile = profileSchema.safeParse(company.quote_profile);
  const formalReady = company.profile_verified && profile.success;
  const issuer = formalReady ? profile.data : null;
  return {
    customer: null as string | null,
    project: null as string | null,
    inputs: input,
    pricing,
    lines,
    freight,
    freight_tax: company.freight_tax,
    freight_vat_rate: company.freight_vat_rate,
    catalog_version: CATALOG_VERSION,
    vat_rate: VAT_RATE,
    total: total / 100,
    subtotal: subtotal / 100,
    vat: (total - subtotal) / 100,
    currency: "MXN" as const,
    mode: input.mode,
    needs_approval: needsApproval,
    pending_tax: pendingTax,
    formal_ready: formalReady,
    issuer: issuer ?? { name: BUSINESS_INFO.name },
    conditions: issuer?.conditions ?? null,
    issued_at: now.toISOString(),
    valid_until: issuer
      ? new Date(now.getTime() + issuer.validity_days * 86400000).toISOString()
      : null,
  };
}
export type QuoteSnapshot = ReturnType<typeof createSnapshot>;
export interface QuoteDocument {
  folio: string;
  revision: number;
  snapshot: QuoteSnapshot;
  approved: boolean;
  customer?: string | null;
  project?: string | null;
}
export function documentStatus(doc: QuoteDocument) {
  const s = doc.snapshot;
  if (
    s.pending_tax ||
    (s.needs_approval && !doc.approved) ||
    (s.mode === "formal" && !s.formal_ready)
  )
    return "BORRADOR · NO AUTORIZADO";
  return s.mode === "formal" ? "COTIZACIÓN FORMAL" : "COTIZACIÓN GENÉRICA";
}
export const money = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    n,
  );
type NumericField = number | string | null | undefined;
const toAmount = (v: NumericField) =>
  v === null || v === undefined || v === "" ? null : Number(v);
/**
 * Lines that break an order's stored total into price, subtotal, VAT and total.
 * Uses only stored amounts; VAT is the stored difference, never a recalculation.
 */
export function orderAmountLines(o: {
  unit_price_before_vat?: NumericField;
  vat_rate?: NumericField;
  total_before_vat?: NumericField;
  total_with_vat?: NumericField;
}): string[] {
  const total = toAmount(o.total_with_vat);
  if (total === null) return ["Importe pactado: Desconocido"];
  const subtotal = toAmount(o.total_before_vat);
  if (subtotal === null) return [`Importe pactado: ${money(total)} MXN`];
  const unit = toAmount(o.unit_price_before_vat);
  const rate = toAmount(o.vat_rate);
  const vat = Math.round((total - subtotal) * 100) / 100;
  const pct =
    rate === null
      ? ""
      : ` ${(rate * 100).toLocaleString("es-MX", { maximumFractionDigits: 2 })} %`;
  return [
    ...(unit === null ? [] : [`Precio unitario sin IVA: ${money(unit)}`]),
    `Subtotal: ${money(subtotal)}`,
    `IVA${pct}: ${money(vat)}`,
    `Importe pactado (con IVA): ${money(total)} MXN`,
  ];
}
export function documentLines(doc: QuoteDocument): string[] {
  const s = doc.snapshot;
  return [
    s.issuer.name,
    documentStatus(doc),
    `Folio ${doc.folio} · revisión ${doc.revision}`,
    `Fecha: ${s.issued_at.slice(0, 10)}`,
    ...("tax_id" in s.issuer
      ? [`RFC: ${s.issuer.tax_id}`, s.issuer.address, s.issuer.contact]
      : []),
    ...(doc.customer ? [`Cliente: ${doc.customer}`] : []),
    ...(doc.project ? [`Obra: ${doc.project}`] : []),
    ...s.lines.map(
      (l) => `${l.label} | ${l.quantity} ${l.unit} | ${money(l.amount)}`,
    ),
    `Subtotal: ${money(s.subtotal)}`,
    `IVA${s.pending_tax ? " conocido (flete pendiente)" : ""}: ${money(s.vat)}`,
    `Total${s.pending_tax ? " provisional" : ""}: ${money(s.total)} MXN`,
    ...(s.freight
      ? [
          `Flete: sugeridos ${s.freight.suggested}; efectivos ${s.freight.effective}; capacidad ${s.freight.capacity} m³; tarifa ${money(s.freight.rate)}/camión`,
        ]
      : []),
    s.valid_until
      ? `Vigencia: ${s.valid_until.slice(0, 10)}`
      : "Vigencia: pendiente de validación por el propietario",
    s.conditions ?? "Condiciones: pendientes de validación por el propietario",
    ...snapshotPending(s).map(pendingLine),
  ];
}
