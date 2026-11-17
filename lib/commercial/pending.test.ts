import { describe, expect, it } from "vitest";
import { pendingData, snapshotPending } from "./pending";
import { createSnapshot, documentLines, documentStatus } from "./quote";
import { quoteInputSchema, type Company } from "./schemas";

// Synthetic values only; none of them is real business data.
const empty: Company = {
  id: "ce000000-0000-4000-8000-000000000002",
  name: "Empresa sintética",
  quote_profile: {},
  profile_verified: false,
  freight_tax: null,
  freight_vat_rate: null,
};
const synthetic = {
  name: "Empresa de prueba",
  tax_id: "XAXX010101000",
  address: "Calle de prueba 123, Colonia Ficticia",
  contact: "Contacto de prueba",
  conditions: "Condiciones sintéticas de prueba.",
  validity_days: 7,
};
const complete: Company = {
  ...empty,
  quote_profile: synthetic,
  profile_verified: true,
  freight_tax: "included",
  freight_vat_rate: 0.08,
};
const destination = {
  dataset_id: "dataset-sintetico",
  api_version: "v0-test",
  verified: true,
  enabled: true,
};
const keys = (items: { key: string }[]) => items.map((i) => i.key);

describe("pendingData", () => {
  it("lists every missing fact with a reason and an effect when nothing is known", () => {
    const items = pendingData({ company: empty });
    expect(keys(items)).toEqual([
      "company_profile",
      "validity_conditions",
      "freight_tax",
      "meta_destination",
      "source_totals",
    ]);
    for (const i of items) {
      expect(i.label).not.toBe("");
      expect(i.reason).not.toBe("");
      expect(i.effect).not.toBe("");
    }
    expect(items[0].reason).toContain("RFC");
    expect(items[1].reason).toContain("vigencia en días");
  });

  it("does not crash without a company or with a non-object profile", () => {
    expect(keys(pendingData({ company: null }))).toContain("company_profile");
    for (const quote_profile of [null, "texto", [], 42])
      expect(() =>
        pendingData({ company: { ...empty, quote_profile } }),
      ).not.toThrow();
  });

  it("keeps the profile pending while the owner has not verified it", () => {
    const items = pendingData({
      company: { ...complete, profile_verified: false },
      destination,
      sourceTotals: { orders: 1, volume: 1, total: 1 },
    });
    expect(keys(items)).toEqual(["company_profile", "validity_conditions"]);
  });

  it("keeps freight IVA pending when the treatment is set but the rate is null", () => {
    const items = pendingData({
      company: { ...complete, freight_vat_rate: null },
    });
    const freight = items.find((i) => i.key === "freight_tax");
    expect(freight?.reason).toContain("tasa");
  });

  it.each([
    [null, "No hay destino"],
    [{ ...destination, dataset_id: null }, "No hay destino"],
    [{ ...destination, verified: false }, "no está verificado"],
    [{ ...destination, enabled: false }, "deshabilitado"],
  ])("keeps the Meta destination pending (%#)", (d, reason) => {
    const item = pendingData({ company: complete, destination: d }).find(
      (i) => i.key === "meta_destination",
    );
    expect(item?.reason).toContain(reason);
  });

  it("keeps source totals pending until confirmed numbers exist", () => {
    expect(
      keys(pendingData({ company: complete, destination })),
    ).toEqual(["source_totals"]);
    expect(
      keys(
        pendingData({
          company: complete,
          destination,
          sourceTotals: { orders: Number.NaN, volume: 1, total: 1 },
        }),
      ),
    ).toEqual(["source_totals"]);
    expect(
      pendingData({
        company: complete,
        destination,
        sourceTotals: { orders: 10, volume: 20, total: 30 },
      }),
    ).toEqual([]);
  });
});

describe("quote documents with missing data", () => {
  const samalayuca = quoteInputSchema.parse({
    volume: 10,
    type: "direct",
    strength: "200",
    zone: "samalayuca",
    mode: "formal",
  });

  it("marks validity, conditions, profile and freight IVA as pending without inventing them", () => {
    const s = createSnapshot(samalayuca, empty);
    expect(s.valid_until).toBeNull();
    expect(s.conditions).toBeNull();
    const doc = { folio: "C-TEST", revision: 1, snapshot: s, approved: false };
    const lines = documentLines(doc);
    expect(documentStatus(doc)).toBe("BORRADOR · NO AUTORIZADO");
    expect(lines).toContain(
      "Vigencia: pendiente de validación por el propietario",
    );
    expect(lines).toContain(
      "Condiciones: pendientes de validación por el propietario",
    );
    expect(lines.some((l) => l.startsWith("Total provisional"))).toBe(true);
    const pending = lines.filter((l) => l.startsWith("Pendiente · "));
    expect(pending).toHaveLength(3);
    expect(lines.join("\n")).not.toMatch(/RFC:/);
  });

  it("reads older stored snapshots that lack the newer fields", () => {
    const s = createSnapshot({ ...samalayuca, zone: "local" }, empty);
    const legacy = { ...s } as Partial<typeof s>;
    delete legacy.valid_until;
    delete legacy.conditions;
    const lines = documentLines({
      folio: "C-OLD",
      revision: 1,
      snapshot: legacy as typeof s,
      approved: false,
    });
    expect(lines).toContain(
      "Vigencia: pendiente de validación por el propietario",
    );
    expect(keys(snapshotPending(legacy))).toEqual([
      "company_profile",
      "validity_conditions",
    ]);
  });

  it("prints no pending lines once every fact is validated", () => {
    const s = createSnapshot(samalayuca, complete);
    const lines = documentLines({
      folio: "C-OK",
      revision: 1,
      snapshot: s,
      approved: true,
    });
    expect(lines.some((l) => l.startsWith("Pendiente · "))).toBe(false);
    expect(lines.some((l) => l.startsWith("Vigencia: 20"))).toBe(true);
  });
});
