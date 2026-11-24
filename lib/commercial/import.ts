import ExcelJS from "exceljs";
import { createHash } from "node:crypto";
import { normalizePhone } from "./schemas";
export type ImportMapping = {
  headerRow: number;
  reference: string;
  customer: string;
  phone?: string;
  volume?: string;
  total?: string;
  orderedAt?: string;
  address?: string;
  // Optional reviewed rules. Every option is opt-in; without them nothing is inferred.
  /** Only these sheets are examined (others are reported, never staged). */
  sheets?: string[];
  /** Columns whose formula cached value is accepted, flagged as «calculado en origen». */
  cachedFormulaColumns?: string[];
  /** IANA zone for date-only Excel cells: the calendar day is kept, local midnight, flagged «sin hora». */
  dateOnlyTimeZone?: string;
  /** Inclusive YYYY-MM-DD bounds; dates outside go to review instead of being corrected. */
  orderedAtRange?: { from: string; to: string };
  /** Source service status column and the values that mean cancelled. */
  status?: string;
  cancelledValues?: string[];
  /** Line kind column and the values whose quantity must not add volume (e.g. fibre «Extra»). */
  lineKind?: string;
  extraValues?: string[];
  /** Lines sharing a reference and customer form one order: total = sum, volume = non-extra sum. */
  groupByReference?: boolean;
  /** Reviewed VAT rate (0–1) already included in the total column; the subtotal is derived from it, never priced. */
  vatIncludedRate?: number;
};
export type PendingIssueCode =
  | "phone_invalid"
  | "amount_invalid"
  | "formula_empty"
  | "date_out_of_range"
  | "grouped_line_without_total";

export type BlockingIssueCode =
  | "missing_reference"
  | "aggregate_row"
  | "missing_customer"
  | "date_unparseable"
  | "mapping_pending"
  | "extra_without_principal"
  | "conflicting_lines"
  | "duplicate_row"
  | "merged_into_another";

export type IssueCode = PendingIssueCode | BlockingIssueCode;

export interface IssueItem {
  code: IssueCode;
  message: string;
}

export function isPendingIssue(issue: string | IssueItem): boolean {
  const text = typeof issue === "string" ? issue : issue.message;
  return (
    text.includes("Teléfono no normalizable") ||
    text.includes("no contiene un número histórico válido") ||
    text.includes("El volumen debe ser positivo") ||
    text.includes("es fórmula sin valor guardado") ||
    text.includes("fuera del periodo de la fuente") ||
    text.includes("no tiene total; no se suma ni se estima")
  );
}

export function classifyIssue(message: string): IssueItem {
  if (message.includes("Falta referencia estable"))
    return { code: "missing_reference", message };
  if (message.includes("suma otras filas"))
    return { code: "aggregate_row", message };
  if (message.includes("Falta nombre de cliente"))
    return { code: "missing_customer", message };
  if (
    message.includes("sin zona horaria confirmada") ||
    message.includes("La fecha trae hora")
  )
    return { code: "date_unparseable", message };
  if (message.includes("Mapeo pendiente"))
    return { code: "mapping_pending", message };
  if (
    message.includes("sin pedido principal") ||
    message.includes("solo tiene líneas «Extra»")
  )
    return { code: "extra_without_principal", message };
  if (
    message.includes("clientes distintos") ||
    message.includes("tiene incidencias; resolverlas antes de promover")
  )
    return { code: "conflicting_lines", message };
  if (message.includes("Contenido idéntico"))
    return { code: "duplicate_row", message };
  if (message.includes("se promueve con su línea principal"))
    return { code: "merged_into_another", message };
  if (message.includes("Teléfono no normalizable"))
    return { code: "phone_invalid", message };
  if (
    message.includes("no contiene un número histórico válido") ||
    message.includes("El volumen debe ser positivo")
  )
    return { code: "amount_invalid", message };
  if (message.includes("es fórmula sin valor guardado"))
    return { code: "formula_empty", message };
  if (message.includes("fuera del periodo de la fuente"))
    return { code: "date_out_of_range", message };
  if (message.includes("no tiene total; no se suma ni se estima"))
    return { code: "grouped_line_without_total", message };

  return { code: "missing_reference", message };
}

export interface StagedRow {
  sheet: string;
  sheet_state: string;
  row_number: number;
  hidden: boolean;
  row_hash: string;
  raw: Record<string, unknown>;
  mapped: Record<string, unknown> | null;
  issues: string[];
}
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`)
      .join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
// Missing mapping stays missing. Formula cached values are never silently trusted as historical facts.
function cellText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number")
    return String(value).trim();
  return "";
}
const isFormula = (v: unknown): v is { formula?: string; sharedFormula?: string; result?: unknown } =>
  Boolean(v && typeof v === "object" && ("formula" in v || "sharedFormula" in v));
const AGGREGATE = /\b(SUBTOTAL|SUM|SUMA|SUMIF|SUMIFS)\s*\(/i;
const SOURCE_COMPUTED = "calculado en origen";
const norm = (s: unknown) => String(s ?? "").trim().toLocaleLowerCase("es-MX");
function offsetAt(instant: number, timeZone: string): number {
  const name = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(new Date(instant))
    .find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = /GMT([+-])(\d{2}):?(\d{2})?/.exec(name);
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 0;
}
/** Local midnight of a calendar day in `timeZone`, as ISO with explicit offset. */
export function localMidnightIso(day: string, timeZone: string): string {
  const [y, mo, d] = day.split("-").map(Number);
  const utc = Date.UTC(y, mo - 1, d);
  const first = offsetAt(utc, timeZone);
  const off = offsetAt(utc - first * 60000, timeZone);
  const sign = off < 0 ? "-" : "+", abs = Math.abs(off);
  return `${day}T00:00:00${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}
export async function inspectWorkbook(
  bytes: Uint8Array,
  mapping?: ImportMapping,
) {
  if (bytes.byteLength > 10 * 1024 * 1024)
    throw new Error("workbook_too_large");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes as never);
  const rows: StagedRow[] = [];
  const sheets: {
    name: string;
    state: string;
    rowCount: number;
    columns: string[];
    examined: boolean;
  }[] = [];
  let cells = 0;
  const cached = new Set((mapping?.cachedFormulaColumns ?? []).map((c) => c.toUpperCase()));
  for (const sheet of workbook.worksheets) {
    if (sheet.rowCount > 20000 || sheet.columnCount > 200)
      throw new Error("workbook_limit");
    const examined = !mapping?.sheets || mapping.sheets.includes(sheet.name);
    const headers: Record<string, string> = {};
    const header = sheet.getRow(mapping?.headerRow ?? 1);
    header.eachCell({ includeEmpty: false }, (cell, n) => {
      headers[sheet.getColumn(n).letter] = cellText(cell.value);
    });
    sheets.push({
      name: sheet.name,
      state: sheet.state,
      rowCount: sheet.rowCount,
      columns: Object.entries(headers).map(
        ([col, title]) => `${col}: ${title}`,
      ),
      examined,
    });
    if (!examined) continue;
    sheet.eachRow({ includeEmpty: false }, (row) => {
      if (row.number <= (mapping?.headerRow ?? 1)) return;
      const raw: Record<string, unknown> = {};
      row.eachCell({ includeEmpty: false }, (cell, n) => {
        cells++;
        if (cells > 500000) throw new Error("workbook_limit");
        const letter = sheet.getColumn(n).letter;
        const v = cell.value;
        raw[letter] =
          v instanceof Date
            ? { date: v.toISOString() }
            : isFormula(v) && v.result instanceof Date
              ? { ...v, result: { date: v.result.toISOString() } }
              : v;
        // Shared formulas keep only a pointer; keep the resolved text for review of aggregates.
        if (isFormula(v) && !v.formula && cached.has(letter) && cell.formula)
          raw[letter] = { ...(raw[letter] as object), formula_text: cell.formula };
      });
      const issues: string[] = [];
      let mapped: Record<string, unknown> | null = null;
      if (mapping) {
        const provenance: Record<string, string> = {};
        const read = (col: string | undefined, field: string) => {
          if (!col) return undefined;
          const L = col.toUpperCase();
          const v = raw[L];
          if (!isFormula(v)) return v;
          if (!cached.has(L)) return v; // stays a formula object → treated as missing/invalid
          const text = String(v.formula ?? (v as { formula_text?: string }).formula_text ?? "");
          if (AGGREGATE.test(text)) {
            issues.push(`La columna ${L} suma otras filas; no es un pedido. Revisar.`);
            return undefined;
          }
          const result = v.result;
          if (result === undefined || result === null || (typeof result === "object" && "error" in (result as object))) {
            issues.push(`La columna ${L} es fórmula sin valor guardado en origen; no se recalcula.`);
            return undefined;
          }
          provenance[field] = SOURCE_COMPUTED;
          return result;
        };
        const reference = cellText(read(mapping.reference, "reference")),
          customer = cellText(read(mapping.customer, "customer"));
        if (!reference)
          issues.push("Falta referencia estable de origen; requiere revisión.");
        if (!customer) issues.push("Falta nombre de cliente.");
        let phone: string | null = null;
        try {
          phone = normalizePhone(cellText(read(mapping.phone, "phone")));
        } catch {
          issues.push("Teléfono no normalizable; revisar código de país.");
        }
        const number = (col: string | undefined, field: string) => {
          const v = read(col, field);
          if (v === undefined || v === null || v === "") return null;
          if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
            issues.push(
              `La columna ${col} no contiene un número histórico válido.`,
            );
            return null;
          }
          return v;
        };
        const dateValue = read(mapping.orderedAt, "ordered_at");
        // Excel calendar dates lack a verified timezone. Preserve them raw and block promotion
        // until the operator supplies a mapping with an explicit offset, rather than inventing it.
        let ordered =
          typeof dateValue === "string" &&
          /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(dateValue) &&
          Number.isFinite(Date.parse(dateValue))
            ? dateValue
            : null;
        let orderedDay: string | null = ordered ? ordered.slice(0, 10) : null;
        const isoDate = (dateValue as { date?: unknown } | undefined)?.date;
        if (!ordered && mapping.dateOnlyTimeZone && typeof isoDate === "string") {
          if (/T00:00:00(?:\.000)?Z$/.test(isoDate)) {
            orderedDay = isoDate.slice(0, 10);
            ordered = localMidnightIso(orderedDay, mapping.dateOnlyTimeZone);
            provenance.ordered_at = `día sin hora en origen; ${mapping.dateOnlyTimeZone}`;
          } else issues.push("La fecha trae hora; no es un día sin hora. Revisar.");
        }
        if (!ordered)
          issues.push("Fecha/hora del pedido sin zona horaria confirmada.");
        else if (
          mapping.orderedAtRange && orderedDay &&
          (orderedDay < mapping.orderedAtRange.from || orderedDay > mapping.orderedAtRange.to)
        )
          issues.push("Fecha del pedido fuera del periodo de la fuente; posible error de captura.");
        const statusText = mapping.status ? cellText(read(mapping.status, "source_status")) : "";
        const cancelled = (mapping.cancelledValues ?? []).some((x) => norm(x) === norm(statusText));
        const kindText = mapping.lineKind ? cellText(read(mapping.lineKind, "line_kind")) : "";
        const extra = (mapping.extraValues ?? []).some((x) => norm(x) === norm(kindText));
        mapped = {
          reference,
          customer,
          phone,
          volume: number(mapping.volume, "volume"),
          total: number(mapping.total, "total"),
          ordered_at: ordered,
          address: cellText(read(mapping.address, "address")) || null,
          ...(mapping.status ? { source_status: cancelled ? "cancelled" : statusText || null, counts_in_totals: !cancelled } : {}),
          ...(mapping.lineKind ? { line_kind: extra ? "extra" : "principal" } : {}),
          ...(mapping.total && mapping.vatIncludedRate !== undefined ? { vat_included_rate: mapping.vatIncludedRate } : {}),
          ...(Object.keys(provenance).length ? { provenance } : {}),
        };
        if (Number(mapped.volume) === 0 && mapped.volume !== null)
          issues.push("El volumen debe ser positivo o desconocido.");
        const pendingIssues = issues.filter(isPendingIssue).map(classifyIssue);
        if (pendingIssues.length > 0) {
          mapped.pending_issues = pendingIssues;
        }
      } else issues.push("Mapeo pendiente de revisión.");
      rows.push({
        sheet: sheet.name,
        sheet_state: sheet.state,
        row_number: row.number,
        hidden: Boolean(row.hidden),
        row_hash: hash(stable(raw)),
        raw,
        mapped,
        issues,
      });
    });
  }
  const grouped = new Map<string, StagedRow[]>();
  for (const row of rows) {
    const key = `${row.sheet}:${row.row_hash}`;
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }
  for (const group of grouped.values())
    if (group.length > 1)
      for (const row of group)
        row.issues.push(
          `Contenido idéntico en ${group.length} filas de esta hoja; conciliar multiplicidad antes de promover.`,
        );
  if (mapping?.groupByReference) {
    groupLines(rows, mapping);
    for (const row of rows) {
      if (row.mapped) {
        const pending = row.issues.filter(isPendingIssue).map(classifyIssue);
        if (pending.length > 0) {
          row.mapped = { ...row.mapped, pending_issues: pending };
        } else if ("pending_issues" in row.mapped) {
          const rest = { ...row.mapped };
          delete rest.pending_issues;
          row.mapped = rest;
        }
      }
    }
  }
  return {
    file_hash: hash(Buffer.from(bytes).toString("base64")),
    sheets,
    rows,
  };
}
// One order per reference. Lines are kept as their own staged rows (traceable), but only the
// principal line is promotable; it carries the summed total and the non-extra volume.
function groupLines(rows: StagedRow[], mapping: ImportMapping) {
  const byRef = new Map<string, StagedRow[]>();
  for (const row of rows) {
    const ref = String(row.mapped?.reference ?? "");
    if (!ref) continue;
    const key = `${row.sheet}:${ref}`;
    byRef.set(key, [...(byRef.get(key) ?? []), row]);
  }
  for (const lines of byRef.values()) {
    lines.sort((a, b) => a.row_number - b.row_number);
    const m = (r: StagedRow) => r.mapped as Record<string, unknown>;
    const isExtra = (r: StagedRow) => m(r).line_kind === "extra";
    if (lines.length === 1) {
      if (isExtra(lines[0]))
        lines[0].issues.push("Línea «Extra» sin pedido principal en su folio; revisar.");
      continue;
    }
    const ref = String(m(lines[0]).reference);
    const sameCustomer = lines.every(
      (r) => norm(m(r).customer) === norm(m(lines[0]).customer) && (m(r).phone ?? null) === (m(lines[0]).phone ?? null),
    );
    const principal = lines.find((r) => !isExtra(r));
    if (!sameCustomer || !principal) {
      for (const r of lines)
        r.issues.push(
          sameCustomer
            ? `El folio ${ref} solo tiene líneas «Extra»; revisar.`
            : `El folio ${ref} se repite con clientes distintos; conciliar antes de promover.`,
        );
      continue;
    }
    const sum = (field: "volume" | "total", only: StagedRow[]) => {
      if (field === "total" && !mapping.total) return null;
      if (field === "volume" && !mapping.volume) return null;
      const vals = only.map((r) => m(r)[field]);
      return vals.some((v) => typeof v !== "number") ? null : Number((vals as number[]).reduce((a, b) => a + b, 0).toFixed(2));
    };
    const total = sum("total", lines);
    const volume = sum("volume", lines.filter((r) => !isExtra(r)));
    const lineIssues = lines.some((r) => r.issues.length > 0);
    principal.mapped = {
      ...m(principal),
      total,
      volume,
      lines: lines.map((r) => ({ row_number: r.row_number, row_hash: r.row_hash, line_kind: m(r).line_kind ?? null, volume: m(r).volume, total: m(r).total })),
      group_hash: hash(lines.map((r) => r.row_hash).sort().join(",")),
    };
    if (mapping.total && total === null)
      principal.issues.push(`Una línea del folio ${ref} no tiene total; no se suma ni se estima.`);
    if (lineIssues)
      principal.issues.push(`Otra línea del folio ${ref} tiene incidencias; resolverlas antes de promover.`);
    for (const r of lines)
      if (r !== principal) {
        r.mapped = { ...m(r), merged_into: principal.row_hash };
        r.issues.push(`Línea agrupada en el folio ${ref}; se promueve con su línea principal.`);
      }
  }
}
