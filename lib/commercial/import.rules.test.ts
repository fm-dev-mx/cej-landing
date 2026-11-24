// @vitest-environment node
// Synthetic data only: reviewed opt-in import rules (sheet filter, cached formulas, date-only
// days in a zone, period bounds, cancelled status and multi-line orders grouped by reference).
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { hasBlockingIssue, inspectWorkbook, localMidnightIso, type ImportMapping } from "./import";

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const mapping: ImportMapping = {
  headerRow: 1,
  reference: "A",
  customer: "B",
  phone: "C",
  volume: "D",
  total: "E",
  orderedAt: "F",
  status: "G",
  lineKind: "H",
  sheets: ["Pedidos"],
  cachedFormulaColumns: ["B", "E"],
  dateOnlyTimeZone: "America/Ciudad_Juarez",
  orderedAtRange: { from: "2025-01-01", to: "2026-11-14" },
  cancelledValues: ["Cancelado"],
  extraValues: ["Extra"],
  groupByReference: true,
};
async function book(rows: unknown[][]) {
  const wb = new ExcelJS.Workbook();
  const s = wb.addWorksheet("Pedidos");
  s.addRow(["Folio", "Cliente", "Tel", "m3", "Total", "Fecha", "Estatus", "Tipo"]);
  for (const r of rows) s.addRow(r);
  const other = wb.addWorksheet("Gastos");
  other.addRow(["x"]);
  other.addRow(["no debe escenificarse"]);
  return new Uint8Array(await wb.xlsx.writeBuffer());
}
const f = (result: unknown, formula = "INDEX(T,1)") => ({ formula, result });

describe("reviewed import rules", () => {
  it("converts a date-only day to local midnight with explicit offset", () => {
    expect(localMidnightIso("2026-01-15", "America/Ciudad_Juarez")).toBe("2026-01-15T00:00:00-07:00");
    expect(localMidnightIso("2026-07-15", "America/Ciudad_Juarez")).toBe("2026-07-15T00:00:00-06:00");
  });

  it("carries the reviewed included VAT rate only when it is configured, without changing the total", async () => {
    const rows = [[102, "Cliente Dos", "", 5, 10800, day("2026-03-02"), "Finalizado", "Bombeado"]];
    const withVat = await inspectWorkbook(await book(rows), { ...mapping, vatIncludedRate: 0.08 });
    expect(withVat.rows[0].mapped).toMatchObject({ total: 10800, vat_included_rate: 0.08 });
    const without = await inspectWorkbook(await book(rows), mapping);
    expect(without.rows[0].mapped).not.toHaveProperty("vat_included_rate");
    expect(without.rows[0].row_hash).toBe(withVat.rows[0].row_hash);
  });

  it("stages only listed sheets and accepts flagged cached formulas", async () => {
    const r = await inspectWorkbook(
      await book([[101, f("Cliente Uno"), "6560000001", 7, f(21000, "D2*2"), day("2026-03-02"), "Finalizado", "Bombeado"]]),
      mapping,
    );
    expect(r.rows).toHaveLength(1);
    expect(r.sheets.find((s) => s.name === "Gastos")?.examined).toBe(false);
    const row = r.rows[0];
    expect(row.issues).toEqual([]);
    expect(row.mapped).toMatchObject({
      reference: "101",
      customer: "Cliente Uno",
      total: 21000,
      ordered_at: "2026-03-02T00:00:00-07:00",
      source_status: "Finalizado",
      counts_in_totals: true,
      provenance: { customer: "calculado en origen", total: "calculado en origen" },
    });
  });

  it("sends aggregates, missing cached values and out-of-period or empty dates to review", async () => {
    const r = await inspectWorkbook(
      await book([
        [201, f("C"), null, 1, f(3000, "D2*3"), day("2006-03-21"), "Finalizado", "Tirado"],
        [202, f("C2"), null, 1, f(undefined, "D3*3"), day("2026-01-05"), "Cancelado", "Tirado"],
        [203, f("C3"), null, 1, f(9000, "SUBTOTAL(9,E2:E4)"), day("2026-01-06"), "Finalizado", "Tirado"],
        [204, f("C4"), null, 1, 10, null, "Finalizado", "Tirado"],
      ]),
      mapping,
    );
    const issues = r.rows.map((x) => x.issues.join(" | "));
    expect(issues[0]).toMatch(/fuera del periodo/);
    expect(issues[1]).toMatch(/sin valor guardado/);
    expect(r.rows[1].mapped).toMatchObject({ source_status: "cancelled", counts_in_totals: false, total: null });
    expect(issues[2]).toMatch(/suma otras filas/);
    expect(issues[3]).toMatch(/sin zona horaria/);
  });

  it("groups lines of one folio: total sums all lines, volume excludes extras", async () => {
    const rows = [
      [301, f("Mismo"), "6560000003", 6, f(18000), day("2026-02-01"), "Finalizado", "Bombeado"],
      [301, f("Mismo"), "6560000003", 6, f(900), day("2026-02-01"), "Finalizado", "Extra"],
    ];
    const r = await inspectWorkbook(await book(rows), mapping);
    const [principal, fibre] = r.rows;
    expect(principal.issues).toEqual([]);
    expect(principal.mapped).toMatchObject({ volume: 6, total: 18900 });
    expect((principal.mapped?.lines as unknown[]).length).toBe(2);
    expect(fibre.mapped?.merged_into).toBe(principal.row_hash);
    expect(fibre.issues.join()).toMatch(/Línea agrupada/);
    // Reordering lines keeps the same group and hashes.
    const again = await inspectWorkbook(await book([rows[1], rows[0]]), mapping);
    const p2 = again.rows.find((x) => x.issues.length === 0);
    expect(p2?.mapped?.group_hash).toBe(principal.mapped?.group_hash);
    expect(again.rows.map((x) => x.row_hash).sort()).toEqual(r.rows.map((x) => x.row_hash).sort());
  });

  it("keeps folio collisions with different customers and lone extras in review", async () => {
    const r = await inspectWorkbook(
      await book([
        [401, f("Uno"), "6560000004", 5, f(15000), day("2026-04-01"), "Finalizado", "Tirado"],
        [401, f("Otro"), "6560000005", 3, f(9000), day("2026-04-02"), "Finalizado", "Tirado"],
        [402, f("Solo"), "6560000006", 2, f(500), day("2026-04-03"), "Finalizado", "Extra"],
      ]),
      mapping,
    );
    expect(r.rows[0].issues.join()).toMatch(/clientes distintos/);
    expect(r.rows[1].issues.join()).toMatch(/clientes distintos/);
    expect(r.rows[2].issues.join()).toMatch(/sin pedido principal/);
    expect(r.rows.every((x) => x.issues.length > 0)).toBe(true);
  });

  it("classifies pending issues (phone, empty formula, invalid volume, out of range, missing group total) and saves them in mapped.pending_issues", async () => {
    const rows = [
      [501, "Cliente Valido", "12345", 5, 10000, day("2026-03-02"), "Finalizado", "Bombeado"],
      [502, "Cliente Formula", "6560000002", 4, f(undefined, "E2*1"), day("2026-03-02"), "Finalizado", "Bombeado"],
      [503, "Cliente Volumen", "6560000003", 0, 10000, day("2026-03-02"), "Finalizado", "Bombeado"],
      [504, "Cliente Rango", "6560000004", 5, 10000, day("2020-01-01"), "Finalizado", "Bombeado"],
    ];
    const r = await inspectWorkbook(await book(rows), mapping);
    expect(r.rows).toHaveLength(4);

    // 501: phone invalid
    expect(r.rows[0].mapped?.pending_issues).toEqual([
      { code: "phone_invalid", message: "Teléfono no normalizable; revisar código de país." },
    ]);

    // 502: formula empty
    expect(r.rows[1].mapped?.pending_issues).toEqual([
      { code: "formula_empty", message: "La columna E es fórmula sin valor guardado en origen; no se recalcula." },
    ]);

    // 503: volume invalid (0)
    expect(r.rows[2].mapped?.pending_issues).toEqual([
      { code: "amount_invalid", message: "El volumen debe ser positivo o desconocido." },
    ]);

    // 504: date out of range
    expect(r.rows[3].mapped?.pending_issues).toEqual([
      { code: "date_out_of_range", message: "Fecha del pedido fuera del periodo de la fuente; posible error de captura." },
    ]);
  });

  it("classifies blocking issues (missing ref, missing customer, aggregate row, missing tz) without treating them as pending", async () => {
    const rows = [
      ["", "Cliente Sin Ref", "6560000001", 5, 10000, day("2026-03-02"), "Finalizado", "Bombeado"],
      [602, "", "6560000002", 5, 10000, day("2026-03-02"), "Finalizado", "Bombeado"],
      [603, "Cliente Agregado", "6560000003", 5, f(50000, "SUM(E1:E10)"), day("2026-03-02"), "Finalizado", "Bombeado"],
      [604, "Cliente Sin Fecha", "6560000004", 5, 10000, null, "Finalizado", "Bombeado"],
    ];
    const r = await inspectWorkbook(await book(rows), mapping);
    expect(r.rows).toHaveLength(4);

    // Each of these rows has blocking issues, so mapped should not classify them as pending
    expect(r.rows[0].issues.join()).toMatch(/referencia estable/);
    expect(r.rows[0].mapped?.pending_issues).toBeUndefined();

    expect(r.rows[1].issues.join()).toMatch(/nombre de cliente/);
    expect(r.rows[1].mapped?.pending_issues).toBeUndefined();

    expect(r.rows[2].issues.join()).toMatch(/suma otras filas/);
    expect(r.rows[2].mapped?.pending_issues).toBeUndefined();

    expect(r.rows[3].issues.join()).toMatch(/sin zona horaria/);
    expect(r.rows[3].mapped?.pending_issues).toBeUndefined();
  });

  it("stores a zero volume as unknown (null) so the order CHECK quantity_m3 > 0 holds", async () => {
    const r = await inspectWorkbook(
      await book([[701, "Cliente Cero", "6560000001", 0, 10000, day("2026-03-02"), "Finalizado", "Bombeado"]]),
      mapping,
    );
    expect(r.rows[0].mapped?.volume).toBeNull();
    expect(r.rows[0].mapped?.issue_codes).toEqual(["amount_invalid"]);
    expect(hasBlockingIssue(r.rows[0])).toBe(false);
  });

  it("keeps issue codes parallel to issues and blocks only on blocking codes", async () => {
    const r = await inspectWorkbook(
      await book([
        [801, "Cliente Tel", "12345", 5, 10000, day("2026-03-02"), "Finalizado", "Bombeado"],
        [802, "", "12345", 5, 10000, day("2026-03-02"), "Finalizado", "Bombeado"],
      ]),
      mapping,
    );
    for (const row of r.rows) expect((row.mapped?.issue_codes as string[]).length).toBe(row.issues.length);
    expect(hasBlockingIssue(r.rows[0])).toBe(false);
    expect(hasBlockingIssue(r.rows[1])).toBe(true);
    // Old staging without codes, or with a missing mapping, stays blocked.
    expect(hasBlockingIssue({ mapped: { reference: "x" }, issues: ["algo"] })).toBe(true);
    expect(hasBlockingIssue({ mapped: null, issues: [] })).toBe(true);
    expect(hasBlockingIssue({ mapped: {}, issues: "x" })).toBe(true);
  });

  it("does not block a folio when another line only has pending issues, and carries them to the order", async () => {
    const r = await inspectWorkbook(
      await book([
        [901, "Mismo", "6560000003", 6, 18000, day("2026-02-01"), "Finalizado", "Bombeado"],
        [901, "Mismo", "6560000003", 6, f(undefined, "E2*1"), day("2026-02-01"), "Finalizado", "Extra"],
      ]),
      { ...mapping, cachedFormulaColumns: ["E"] },
    );
    const principal = r.rows[0];
    expect(principal.issues.join()).not.toMatch(/resolverlas antes de promover/);
    expect((principal.mapped?.issue_codes as string[]) ?? []).not.toContain("conflicting_lines");
    expect((principal.mapped?.pending_issues as { code: string }[]).map((x) => x.code)).toEqual(
      expect.arrayContaining(["grouped_line_without_total", "formula_empty"]),
    );
    expect(hasBlockingIssue(principal)).toBe(false);
    expect(hasBlockingIssue(r.rows[1])).toBe(true);
  });

  it("blocks the folio when another line has a blocking issue", async () => {
    const r = await inspectWorkbook(
      await book([
        [902, "Mismo", "6560000003", 6, 18000, day("2026-02-01"), "Finalizado", "Bombeado"],
        [902, "Mismo", "6560000003", 6, 900, null, "Finalizado", "Extra"],
      ]),
      mapping,
    );
    expect(r.rows[0].mapped?.issue_codes).toContain("conflicting_lines");
    expect(hasBlockingIssue(r.rows[0])).toBe(true);
  });
});
