// @vitest-environment node
import { beforeAll, describe, it, expect, vi } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { Database, Json } from "@/types/database";
import { quoteInputSchema } from "@/lib/commercial/schemas";
import { documentLines, type QuoteSnapshot } from "@/lib/commercial/quote";
import { prepareBusinessEvent } from "@/lib/commercial/marketing";

// Only the Next request-cookie boundary is substituted. Auth, RLS, RPCs and storage are real.
const jar = vi.hoisted(() => new Map<string, string>());
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
    getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
    set: (name: string, value: string) => jar.set(name, value),
  }),
}));
import { executeCommand } from "@/lib/commercial/service";
import { requirePermission } from "@/lib/auth/requirePermission";
import { dispatchTestOutbox } from "@/lib/commercial/outbox";
import { quotePdf, quotePng } from "@/lib/commercial/exports";
import { submitLead } from "@/app/actions/submitLead";
import { env } from "@/config/env";
import { loadChoices, loadTeam } from "@/lib/commercial/queries";

const A = "ce000000-0000-4000-8000-000000000001",
  B = "ce000000-0000-4000-8000-000000000002";
const input = quoteInputSchema.parse({
  volume: 15,
  strength: "200",
  type: "pumped",
});
const run = process.env.CEJ_LOCAL_INTEGRATION === "1";
describe.skipIf(!run)("isolated local Postgres commercial workflow", () => {
  let admin: SupabaseClient<Database>,
    client: SupabaseClient<Database>,
    owner: string,
    customer: string,
    order: string;
  async function login(label = "owner-a") {
    jar.clear();
    const auth = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
          setAll: (values) => values.forEach((x) => jar.set(x.name, x.value)),
        },
      },
    );
    const { data, error } = await auth.auth.signInWithPassword({
      email: `${label}@cej.invalid`,
      password: process.env.CEJ_TEST_PASSWORD!,
    });
    if (error || !data.session) throw new Error("Synthetic login failed");
    client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false },
        global: {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        },
      },
    );
    return data.user!.id;
  }
  async function row(id = order) {
    const { data, error } = await admin
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();
    expect(error).toBeNull();
    return data!;
  }
  beforeAll(async () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe("http://127.0.0.1:55421");
    admin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
    owner = await login();
    await executeCommand({
      kind: "configure",
      profile: {
        name: "CEJ ENSAYO, sin validez comercial",
        tax_id: "AAA010101AAA",
        address: "Domicilio sintético para pruebas locales",
        contact: "Contacto sintético local",
        conditions: "Condiciones exclusivamente sintéticas para ensayo.",
        validity_days: 15,
      },
      verified: true,
      freight_tax: "included",
      freight_vat_rate: 0.08,
    });
    customer = (
      await executeCommand({
        kind: "customer",
        name: `Cliente sintético ${crypto.randomUUID()}`,
        phone: "",
      })
    ).id;
  }, 30000);

  it("persists generic quotes without customers, requests or conversions", async () => {
    const before = await admin
      .from("marketing_outbox")
      .select("id", { count: "exact", head: true })
      .eq("company_id", A);
    const q = await executeCommand({ kind: "quote", input });
    const { data } = await admin
      .from("quotes")
      .select("*")
      .eq("id", q.id)
      .single();
    expect(data).toMatchObject({
      customer_id: null,
      project_id: null,
      lead_id: null,
    });
    const after = await admin
      .from("marketing_outbox")
      .select("id", { count: "exact", head: true })
      .eq("company_id", A);
    expect(after.count).toBe(before.count);
  });
  it("links a real self-service request with its customer and a stable Pixel/CAPI event ID atomically", async () => {
    const hostname = new URL(env.NEXT_PUBLIC_SITE_URL).hostname;
    const binding = await admin
      .from("company_websites")
      .upsert({ hostname, company_id: A, enabled: true });
    expect(binding.error).toBeNull();
    const event = crypto.randomUUID();
    const phone = `656${String(Math.floor(Math.random() * 10000000)).padStart(7, "0")}`;
    const payload = {
      name: "Solicitud pública sintética",
      phone,
      privacy_accepted: true as const,
      quote: { total: 1234 },
      fb_event_id: event,
    };
    const [first, second] = await Promise.all([
      submitLead(payload),
      submitLead(payload),
    ]);
    expect(first.success).toBe(true);
    expect(second.id).toBe(first.id);
    const { data: lead } = await admin
      .from("leads")
      .select("*")
      .eq("id", Number(first.id))
      .single();
    expect(lead).toMatchObject({
      company_id: A,
      phone_norm: `52${phone}`,
      source_channel: "website",
      captured_by: null,
      utm_source: null,
      utm_medium: null,
    });
    expect(lead!.customer_id).toBeTruthy();
    const outbox = await admin
      .from("marketing_outbox")
      .select("*")
      .eq("event_id", event);
    expect(outbox.data).toHaveLength(1);
    expect(outbox.data![0]).toMatchObject({
      event_name: "Lead",
      status: "pending_eligibility",
    });
    const operatorRequest = await executeCommand({
      kind: "request",
      customer_id: customer,
      occurred_at: new Date(Date.now() - 1000).toISOString(),
      source_channel: "chat",
      origin: null,
    });
    const actual = await admin
      .from("leads")
      .select("captured_by,source_channel,customer_source")
      .eq("id", Number(operatorRequest.id))
      .single();
    expect(actual.data).toMatchObject({
      captured_by: owner,
      source_channel: "chat",
      customer_source: null,
    });
    const linked = await executeCommand({
      kind: "quote",
      customer_id: customer,
      lead_id: Number(operatorRequest.id),
      input: { ...input, mode: "formal" },
    });
    const linkedOrder = await executeCommand({
      kind: "order",
      revision_id: linked.revision_id,
      address: "Dirección sintética vinculada",
    });
    const linkedRow = await row(linkedOrder.id);
    expect(linkedRow.lead_id).toBe(Number(operatorRequest.id));
    await expect(
      executeCommand({
        kind: "quote",
        customer_id: lead!.customer_id!,
        lead_id: Number(operatorRequest.id),
        input: { ...input, mode: "formal" },
      }),
    ).rejects.toThrow("request_customer_mismatch");
  });
  it("persists exact formal revisions, approval and all exports; revalidates economic changes", async () => {
    const project = await executeCommand({
      kind: "project",
      customer_id: customer,
      name: "Obra sintética",
      address: "Dirección sintética de ensayo",
      responsible_id: owner,
    });
    const q = await executeCommand({
      kind: "quote",
      customer_id: customer,
      project_id: project.id,
      input: {
        ...input,
        mode: "formal",
        zone: "samalayuca",
        capacity: 5,
        trucks: 5,
        truckReason: "Acceso validado",
        discount: 100,
        reason: "Excepción sintética",
      },
    });
    await expect(
      executeCommand({
        kind: "order",
        revision_id: q.revision_id,
        address: "Dirección sintética de ensayo",
      }),
    ).rejects.toThrow("offer_not_authorized");
    await login("operator-a");
    await expect(
      executeCommand({ kind: "approve", id: q.revision_id, reason: "Ensayo" }),
    ).rejects.toThrow("permission_denied");
    await login();
    await executeCommand({
      kind: "approve",
      id: q.revision_id,
      reason: "Autorización sintética exacta",
    });
    const { data: rev } = await admin
      .from("quote_revisions")
      .select("*")
      .eq("id", q.revision_id!)
      .single();
    const snapshot = rev!.snapshot as unknown as QuoteSnapshot;
    expect(snapshot.freight).toMatchObject({
      effective: 5,
      suggested: 4,
      amount: 7500,
    });
    const doc = {
      folio: q.folio!,
      revision: 1,
      snapshot,
      approved: true,
      customer: snapshot.customer,
      project: snapshot.project,
    };
    const text = documentLines(doc).join("\n");
    expect(text).toContain("$7,500.00");
    expect(text).toContain("efectivos 5");
    expect(text).not.toContain("Excepción sintética");
    const pdf = await quotePdf(doc),
      png = await quotePng(doc);
    expect(Buffer.from(pdf).subarray(0, 4).toString()).toBe("%PDF");
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    const created = await Promise.all([
      executeCommand({
        kind: "order",
        revision_id: q.revision_id,
        address: "Dirección sintética de ensayo",
      }),
      executeCommand({
        kind: "order",
        revision_id: q.revision_id,
        address: "Dirección sintética de ensayo",
      }),
    ]);
    expect(created[0].id).toBe(created[1].id);
    order = created[0].id;
    expect((await row()).total_with_vat).toBe(snapshot.total);
    const immutable = await admin
      .from("quote_revisions")
      .update({ snapshot: { total: 1 } })
      .eq("id", q.revision_id!);
    expect(immutable.error?.message).toBe("immutable_fact");
    const q2 = await executeCommand({
      kind: "quote",
      id: q.id,
      expected_version: 1,
      customer_id: customer,
      input: {
        ...input,
        mode: "formal",
        discount: 200,
        reason: "Otra excepción",
      },
    });
    await expect(
      executeCommand({
        kind: "order",
        revision_id: q2.revision_id,
        address: "Dirección sintética de ensayo",
      }),
    ).rejects.toThrow("offer_not_authorized");
    const { data: old } = await admin
      .from("quote_revisions")
      .select("snapshot")
      .eq("id", q.revision_id!)
      .single();
    expect(old!.snapshot).toEqual(rev!.snapshot);
    await expect(
      executeCommand({ kind: "quote", id: q.id, expected_version: 1, input }),
    ).rejects.toThrow("version_conflict");
  }, 30000);
  it("confirms without deposit exactly once and records subsequent payments separately", async () => {
    const v = (await row()).version;
    const confirm = {
      kind: "confirm",
      id: order,
      expected_version: v,
      accepted: true,
      accepted_at: new Date(Date.now() - 1000).toISOString(),
      source_channel: "phone_call",
      origin: null,
    };
    await Promise.all([executeCommand(confirm), executeCommand(confirm)]);
    let o = await row();
    expect(o.order_status).toBe("confirmed");
    expect(
      Number((o.payments_summary_json as { net_paid?: number })?.net_paid ?? 0),
    ).toBe(0);
    const sales = await admin
      .from("sale_facts")
      .select("*")
      .eq("order_id", order);
    expect(sales.data).toHaveLength(1);
    const fact = sales.data![0];
    expect(fact).toMatchObject({
      amount_mxn: o.total_with_vat,
      quote_revision_id: o.quote_revision_id,
    });
    await executeCommand({
      kind: "payment",
      id: order,
      expected_version: o.version,
      amount: 500,
      kind_payment: "anticipo",
      method: "efectivo",
      paid_at: new Date().toISOString(),
      reference: "Ensayo",
    });
    o = await row();
    expect(
      Number((o.payments_summary_json as { net_paid?: number })?.net_paid ?? 0),
    ).toBe(500);
    const out = await admin
      .from("marketing_outbox")
      .select("*")
      .eq("fact_id", fact.id);
    expect(out.data).toHaveLength(1);
    expect(out.data![0].status).toBe("pending_eligibility");
    const count = await admin
      .from("sale_facts")
      .select("id", { count: "exact", head: true })
      .eq("order_id", order);
    expect(count.count).toBe(1);
  });
  it("creates direct orders without fake requests and rejects concurrent stale schedules", async () => {
    const direct = await executeCommand({
      kind: "order",
      customer_id: customer,
      input,
      address: "Obra directa sintética",
    });
    expect(await row(direct.id)).toMatchObject({
      quote_revision_id: null,
      lead_id: null,
    });
    const o = await row();
    const schedule = {
      kind: "schedule",
      id: order,
      expected_version: o.version,
      start: "2026-12-01T10:00:00-07:00",
      end: "2026-12-01T11:00:00-07:00",
      reason: "Horario convenido",
      acknowledge_conflicts: true,
    };
    const results = await Promise.allSettled([
      executeCommand(schedule),
      executeCommand({
        ...schedule,
        start: "2026-12-01T12:00:00-07:00",
        end: "2026-12-01T13:00:00-07:00",
      }),
    ]);
    expect(results.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((x) => x.status === "rejected")).toHaveLength(1);
    expect((await row()).scheduled_window_start).not.toBe(
      (await row()).ordered_at,
    );
    await executeCommand({
      kind: "confirm",
      id: direct.id,
      expected_version: 1,
      accepted: true,
      accepted_at: new Date(Date.now() - 1000).toISOString(),
      source_channel: null,
      origin: null,
    });
    const scheduled = await row();
    await expect(
      executeCommand({
        ...schedule,
        id: direct.id,
        expected_version: 2,
        start: scheduled.scheduled_window_start,
        end: scheduled.scheduled_window_end,
        acknowledge_conflicts: false,
      }),
    ).rejects.toThrow("schedule_overlap");
  });
  it("completes a followup with result and next action without retyping identity", async () => {
    const f = await executeCommand({
      kind: "followup",
      customer_id: customer,
      responsible_id: owner,
      action: "Llamar al cliente sintético",
      due_at: new Date().toISOString(),
    });
    await executeCommand({
      kind: "complete_followup",
      id: f.id,
      expected_version: 1,
      result: "Confirmó interés",
      next_action: "Revisar obra",
      next_due_at: new Date(Date.now() + 86400000).toISOString(),
    });
    const next = await admin
      .from("followups")
      .select("*")
      .eq("previous_id", f.id)
      .single();
    expect(next.data).toMatchObject({
      customer_id: customer,
      responsible_id: owner,
      action: "Revisar obra",
    });
    await expect(
      executeCommand({
        kind: "complete_followup",
        id: f.id,
        expected_version: 1,
        result: "Repetido",
        next_action: "",
      }),
    ).rejects.toThrow("version_conflict");
  });
  it("enforces managed memberships and cross-company isolation even with forged user metadata", async () => {
    await login("owner-b");
    const hidden = await client.from("orders").select("id").eq("id", order);
    expect(hidden.error).toBeNull();
    expect(hidden.data).toEqual([]);
    const cross = await client.rpc("cej_summary", { c: A });
    expect((cross.data as { sales: number }).sales).toBe(0);
    await expect(
      executeCommand({
        kind: "order",
        customer_id: customer,
        input,
        address: "Otra empresa sintética",
      }),
    ).rejects.toThrow();
    const direct = await client
      .from("customers")
      .insert({ company_id: B, display_name: "Forbidden" });
    expect(direct.error).not.toBeNull();
    const forged = await client.rpc("cej_command", {
      c: A,
      actor: owner,
      kind: "customer",
      p: { name: "Forbidden" },
    });
    expect(forged.error).not.toBeNull();
    await login("unassigned");
    await expect(requirePermission("read")).rejects.toThrow(
      "permission_denied",
    );
    await login("viewer-a");
    await expect(
      executeCommand({ kind: "customer", name: "Forbidden", phone: "" }),
    ).rejects.toThrow("permission_denied");
    await login();
    await expect(
      executeCommand({
        kind: "membership",
        user_id: owner,
        role: "viewer",
        active: true,
        reason: "Ensayo último dueño",
      }),
    ).rejects.toThrow("last_owner");
  });
  it("stages and promotes historical values idempotently without pricing or marketing reconstruction", async () => {
    const reference = `SYN-${crypto.randomUUID()}`;
    const hash = crypto.randomUUID();
    const staged = {
      sheet: "Hoja oculta",
      sheet_state: "hidden",
      row_number: 3,
      hidden: true,
      row_hash: hash,
      raw: { A: reference },
      mapped: {
        reference,
        customer: "Cliente histórico sintético",
        phone: null,
        ordered_at: "2024-01-05T10:00:00-07:00",
        volume: 7,
        total: null,
        address: null,
      },
      issues: [],
    };
    const p = JSON.parse(
      JSON.stringify({
        source_name: "synthetic.xlsx",
        file_hash: hash,
        rows: [staged],
      }),
    ) as Json;
    for (let i = 0; i < 2; i++) {
      const result = await admin.rpc("cej_command", {
        c: A,
        actor: owner,
        kind: "stage",
        p,
      });
      expect(result.error).toBeNull();
    }
    const rows = await admin
      .from("import_rows")
      .select("*")
      .eq("row_hash", hash);
    expect(rows.data).toHaveLength(1);
    const r = rows.data![0];
    const first = await admin.rpc("cej_promote_import", {
      c: A,
      actor: owner,
      row_id: r.id,
      expected_hash: hash,
    });
    expect(first.error).toBeNull();
    const second = await admin.rpc("cej_promote_import", {
      c: A,
      actor: owner,
      row_id: r.id,
      expected_hash: hash,
    });
    expect(second.data).toEqual(first.data);
    const historical = await row((first.data as { id: string }).id);
    expect(historical).toMatchObject({
      quantity_m3: 7,
      total_with_vat: null,
      confirmed_at: null,
    });
    const sales = await admin
      .from("sale_facts")
      .select("id")
      .eq("order_id", historical.id);
    expect(sales.data).toHaveLength(0);
    const changed = {
      ...staged,
      row_hash: crypto.randomUUID(),
      mapped: { ...staged.mapped, total: 1 },
    };
    await admin.rpc("cej_command", {
      c: A,
      actor: owner,
      kind: "stage",
      p: JSON.parse(
        JSON.stringify({ ...(p as object), rows: [changed] }),
      ) as Json,
    });
    const newer = await admin
      .from("import_rows")
      .select("id")
      .eq("row_hash", changed.row_hash)
      .single();
    const conflict = await admin.rpc("cej_promote_import", {
      c: A,
      actor: owner,
      row_id: newer.data!.id,
      expected_hash: changed.row_hash,
    });
    expect(conflict.error?.message).toBe("import_conflict");
  });
  it("searches customers beyond the initial choice limit and exposes only company colleagues", async () => {
    await login();
    const token = crypto.randomUUID();
    const names = Array.from({ length: 55 }, (_, i) => ({
      company_id: A,
      display_name: `Lookup ${token} ${String(i).padStart(2, "0")}`,
    }));
    const { error } = await admin.from("customers").insert(names);
    expect(error).toBeNull();
    const initial = await loadChoices({ customerTerm: `Lookup ${token}` });
    expect(initial.customerCount).toBe(55);
    expect(initial.customers).toHaveLength(50);
    const found = await loadChoices({ customerTerm: `Lookup ${token} 54` });
    expect(found.customers).toHaveLength(1);
    const team = await loadTeam();
    expect(team.some((m) => m.label === "owner-a@cej.invalid")).toBe(true);
    expect(team.some((m) => m.label === "owner-b@cej.invalid")).toBe(false);
  });
  it("leases test deliveries, retries API failure and never resends accepted facts", async () => {
    const { data: fact } = await admin
      .from("sale_facts")
      .select("*")
      .eq("order_id", order)
      .single();
    const prepared = prepareBusinessEvent({
      companyId: A,
      factId: fact!.id,
      eventId: `sale:${fact!.id}`,
      name: "Purchase",
      occurredAt: fact!.occurred_at,
      imported: false,
      consent: true,
      customerPhone: "6561234567",
      actionSource: "phone_call",
      amount: fact!.amount_mxn,
      currency: "MXN",
    });
    expect(prepared.eligible).toBe(true);
    await admin.from("marketing_destinations").upsert({
      company_id: A,
      dataset_id: "synthetic",
      api_version: "synthetic",
      verified: true,
      enabled: true,
      test_only: true,
    });
    await admin
      .from("marketing_outbox")
      .update({ status: "ready", payload: prepared.payload as Json })
      .eq("fact_id", fact!.id);
    const config = {
      datasetId: "synthetic",
      apiVersion: "synthetic",
      verified: true,
      testOnly: true as const,
      testEventCode: "TEST",
      accessToken: "SYNTHETIC",
    };
    const fail = vi.fn(async () => ({ httpOk: false }));
    const first = await dispatchTestOutbox(admin, A, config, fail);
    expect(first.some((x) => x.status === "retry")).toBe(true);
    await admin
      .from("marketing_outbox")
      .update({ next_attempt_at: new Date().toISOString() })
      .eq("fact_id", fact!.id);
    const accept = vi.fn(async () => ({ httpOk: true, events_received: 1 }));
    const results = await Promise.all([
      dispatchTestOutbox(admin, A, config, accept),
      dispatchTestOutbox(admin, A, config, accept),
    ]);
    expect(results.flat().filter((x) => x.status === "accepted")).toHaveLength(
      1,
    );
    expect(accept).toHaveBeenCalledTimes(1);
    await dispatchTestOutbox(admin, A, config, accept);
    expect(accept).toHaveBeenCalledTimes(1);
  });
});
