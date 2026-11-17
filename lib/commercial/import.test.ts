// @vitest-environment node
import ExcelJS from "exceljs";
import { it, expect } from "vitest";
import { inspectWorkbook } from "./import";
it("includes hidden sheets/rows, preserves provenance and is independent of row ordering", async () => {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Datos", { state: "hidden" });
  sheet.addRow([
    "Referencia",
    "Cliente",
    "Teléfono",
    "Volumen",
    "Total",
    "Fecha",
  ]);
  sheet.addRow([
    "SYN-1",
    "Cliente de ensayo",
    "6561234567",
    10,
    30000,
    "2026-11-14T09:00:00-07:00",
  ]);
  sheet.getRow(2).hidden = true;
  sheet.addRow([
    "SYN-2",
    "Otro de ensayo",
    "+52 6561234567",
    14,
    null,
    "2026-11-14T10:00:00-07:00",
  ]);
  const mapping = {
    headerRow: 1,
    reference: "A",
    customer: "B",
    phone: "C",
    volume: "D",
    total: "E",
    orderedAt: "F",
  };
  const first = await inspectWorkbook(
    new Uint8Array(await book.xlsx.writeBuffer()),
    mapping,
  );
  expect(first.rows[0]).toMatchObject({
    sheet_state: "hidden",
    hidden: true,
    row_number: 2,
    mapped: { phone: "526561234567", total: 30000 },
  });
  expect(first.rows[1].mapped?.total).toBeNull();
  const a = sheet.getRow(2).values,
    b = sheet.getRow(3).values;
  sheet.getRow(2).values = b;
  sheet.getRow(3).values = a;
  const second = await inspectWorkbook(
    new Uint8Array(await book.xlsx.writeBuffer()),
    mapping,
  );
  expect(first.rows.map((r) => r.row_hash).sort()).toEqual(
    second.rows.map((r) => r.row_hash).sort(),
  );
});
it("does not infer formula totals, unknown dates, payments or current prices", async () => {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("Datos");
  sheet.addRow(["Ref", "Cliente", "Total", "Fecha"]);
  sheet.addRow(["SYN", "Cliente", { formula: "2*3", result: 6 }, new Date()]);
  const result = await inspectWorkbook(
    new Uint8Array(await book.xlsx.writeBuffer()),
    { headerRow: 1, reference: "A", customer: "B", total: "C", orderedAt: "D" },
  );
  expect(result.rows[0].mapped?.total).toBeNull();
  expect(result.rows[0].issues.length).toBeGreaterThan(0);
  expect(result.rows[0].raw.C).toEqual({ formula: "2*3", result: 6 });
});
