import { describe, it, expect } from "vitest";
import {
  calculateFreight,
  createSnapshot,
  documentLines,
  documentStatus,
  orderAmountLines,
} from "./quote";
import { quoteInputSchema, normalizePhone, type Company } from "./schemas";
import { calcVolumeFromArea, calcQuote } from "@/lib/pricing";
export const company: Company = {
  id: "ce000000-0000-4000-8000-000000000001",
  name: "Empresa sintética",
  quote_profile: {},
  profile_verified: false,
  freight_tax: null,
  freight_vat_rate: null,
};
describe("Samalayuca acceptance cases", () => {
  it.each([
    [10, "direct", 2, 3000],
    [10, "pumped", 3, 4500],
    [14, "direct", 2, 3000],
    [14, "pumped", 3, 4500],
    [15, "direct", 3, 4500],
    [15, "pumped", 4, 6000],
  ] as const)("%s m³ %s", (volume, type, effective, amount) => {
    const input = quoteInputSchema.parse({ volume, type, strength: "200" });
    expect(calculateFreight(input)).toMatchObject({
      effective,
      amount,
      capacity: 7,
    });
  });
  it("supports another capacity and requires reason for a positive integer operational override", () => {
    const input = quoteInputSchema.parse({
      volume: 15,
      type: "pumped",
      strength: "200",
      capacity: 5,
    });
    expect(calculateFreight(input)).toMatchObject({
      suggested: 4,
      amount: 6000,
    });
    expect(() => calculateFreight({ ...input, trucks: 5 })).toThrow(
      "truck_reason_required",
    );
    expect(
      calculateFreight({
        ...input,
        trucks: 5,
        truckReason: "Acceso de obra validado",
      }),
    ).toMatchObject({ effective: 5, suggested: 4, amount: 7500 });
    for (const trucks of [0, -1, 1.2, Infinity])
      expect(() =>
        calculateFreight({ ...input, trucks, truckReason: "test" }),
      ).toThrow();
  });
});
describe("shared pricing and immutable commercial output", () => {
  it("uses the public engine, includes fiber and never adds another pump charge", () => {
    const input = quoteInputSchema.parse({
      volume: 10,
      strength: "200",
      type: "pumped",
      hasFiber: true,
    });
    const s = createSnapshot(input, company);
    expect(s.total).toBe(
      calcQuote(10, "200", "pumped", undefined, { hasFiber: true }).total,
    );
    expect(s.lines).toHaveLength(2);
    expect(s.lines[1].amount).toBe(1300);
    expect(s.lines.reduce((a, l) => a + l.amount, 0)).toBe(s.total);
  });
  it("keeps unknown freight tax pending only for the affected zone", () => {
    const input = quoteInputSchema.parse({
      volume: 14,
      strength: "200",
      type: "direct",
      zone: "samalayuca",
    });
    const s = createSnapshot(input, company);
    expect(s.pending_tax).toBe(true);
    expect(
      createSnapshot({ ...input, zone: "local" }, company).pending_tax,
    ).toBe(false);
    expect(
      documentStatus({
        folio: "TEST",
        revision: 1,
        snapshot: s,
        approved: true,
      }),
    ).toContain("BORRADOR");
  });
  it("classifies operational count separately from economic rate exceptions and preserves the amount in output", () => {
    const input = quoteInputSchema.parse({
      volume: 15,
      strength: "200",
      type: "pumped",
      zone: "samalayuca",
      capacity: 5,
      trucks: 5,
      truckReason: "Operación validada",
    });
    const s = createSnapshot(input, {
      ...company,
      freight_tax: "included",
      freight_vat_rate: 0.08,
    });
    expect(s.needs_approval).toBe(false);
    expect(s.freight?.amount).toBe(7500);
    const lines = documentLines({
      folio: "TEST",
      revision: 1,
      snapshot: s,
      approved: false,
    });
    expect(lines.join("\n")).toContain("efectivos 5");
    expect(lines.join("\n")).toContain("$7,500.00");
    expect(
      createSnapshot(
        { ...input, freightRate: 1600, reason: "Tarifa especial" },
        company,
      ).needs_approval,
    ).toBe(true);
  });
  it("keeps 7/10 cm coffered factors as geometry rather than products or concrete thickness", () => {
    expect(
      calcVolumeFromArea({
        areaM2: 100,
        hasCofferedSlab: true,
        cofferedSize: "7",
      }),
    ).toBeCloseTo(8.5);
    expect(
      calcVolumeFromArea({
        areaM2: 100,
        hasCofferedSlab: true,
        cofferedSize: "10",
      }),
    ).toBeCloseTo(10.8);
  });
  it("does not export economic exception reasons or private operational notes", () => {
    const s = createSnapshot(
      quoteInputSchema.parse({
        volume: 10,
        strength: "200",
        type: "direct",
        discount: 100,
        reason: "PRIVATE MARGIN",
      }),
      company,
    );
    expect(
      documentLines({
        folio: "TEST",
        revision: 1,
        snapshot: s,
        approved: false,
      }).join("\n"),
    ).not.toContain("PRIVATE");
  });
});
it.each([
  ["656 123 4567", "526561234567"],
  ["+52 6561234567", "526561234567"],
  ["+5216561234567", "526561234567"],
  ["+1 915 123 4567", "19151234567"],
  ["", null],
])("normalizes capture and import phone %s identically", (raw, expected) =>
  expect(normalizePhone(raw!)).toBe(expected),
);

describe("order amount breakdown", () => {
  it("shows price, subtotal, stored VAT difference and total", () => {
    const lines = orderAmountLines({
      unit_price_before_vat: "1000.00",
      vat_rate: "0.0800",
      total_before_vat: "2000.00",
      total_with_vat: "2160.00",
    });
    expect(lines).toHaveLength(4);
    expect(lines[0]).toContain("Precio unitario sin IVA");
    expect(lines[1]).toContain("2,000.00");
    expect(lines[2]).toMatch(/^IVA 8 %: .*160\.00$/);
    expect(lines[3]).toContain("2,160.00");
  });
  it("keeps the total alone when no subtotal is stored", () => {
    expect(
      orderAmountLines({ total_with_vat: 500, total_before_vat: null }),
    ).toEqual([expect.stringMatching(/^Importe pactado: .*500\.00 MXN$/)]);
  });
  it("reports an unknown total", () => {
    expect(orderAmountLines({ total_with_vat: null })).toEqual([
      "Importe pactado: Desconocido",
    ]);
  });
});
