import "server-only";
import { requirePermission } from "@/lib/auth/requirePermission";
import { createAdminClient } from "@/lib/supabase/server";
import { commandSchema, customerInputSchema, quoteInputSchema } from "./schemas";
import { createSnapshot } from "./quote";
import { snapshotPending } from "./pending";
import type { Json } from "@/types/database";

export async function previewQuote(raw: unknown) {
  const session = await requirePermission("read");
  const input = quoteInputSchema.parse(raw);
  const snapshot = createSnapshot(input, session.company);
  const pending = snapshotPending(snapshot);
  return {
    subtotal: snapshot.subtotal,
    vat: snapshot.vat,
    total: snapshot.total,
    pending_tax: snapshot.pending_tax,
    needs_approval: snapshot.needs_approval,
    pending: pending.map((p) => ({
      key: p.key,
      label: p.label,
      reason: p.reason,
      effect: p.effect,
    })),
  };
}

export async function executeCommand(raw: unknown) {
  const input = commandSchema.parse(raw);
  const permission = ["configure", "membership"].includes(input.kind)
    ? "configure"
    : input.kind === "approve"
      ? "approve"
      : "write";
  const session = await requirePermission(permission);
  const { kind, ...rest } = input;
  const payload: Record<string, unknown> = { ...rest };
  if (input.kind === "project")
    payload.responsible_id = input.responsible_id ?? session.userId;
  if (input.kind === "customer")
    Object.assign(payload, customerInputSchema.parse(input));
  if (
    input.kind === "quote" ||
    (input.kind === "order" && !input.revision_id)
  ) {
    if (!input.input) throw new Error("quote_input_required");
    const snapshot = createSnapshot(input.input, session.company);
    if (input.customer_id) {
      const { data, error } = await session.db
        .from("customers")
        .select("display_name")
        .eq("company_id", session.company.id)
        .eq("id", input.customer_id)
        .single();
      if (error) throw new Error("customer_required");
      snapshot.customer = data.display_name;
    }
    if (input.project_id) {
      const { data, error } = await session.db
        .from("projects")
        .select("name")
        .eq("company_id", session.company.id)
        .eq("customer_id", input.customer_id!)
        .eq("id", input.project_id)
        .single();
      if (error) throw new Error("not_found");
      snapshot.project = data.name;
    }
    Object.assign(payload, {
      snapshot,
      pending_tax: snapshot.pending_tax,
      needs_approval: snapshot.needs_approval,
      reason: input.input.reason,
    });
    if (input.kind === "quote" && input.id && !input.expected_version)
      throw new Error("version_required");
    if (
      input.kind === "quote" &&
      input.input.mode === "formal" &&
      !input.customer_id
    )
      throw new Error("customer_required");
  }
  if (
    input.kind === "complete_followup" &&
    input.next_action &&
    !input.next_due_at
  )
    throw new Error("next_due_required");
  if (
    input.kind === "confirm" &&
    new Date(input.accepted_at).getTime() > Date.now()
  )
    throw new Error("future_acceptance");
  if (
    input.kind === "request" &&
    new Date(input.occurred_at).getTime() > Date.now()
  )
    throw new Error("future_request");
  if (input.kind === "schedule") {
    const { data: current, error: currentError } = await session.db
      .from("orders")
      .select("scheduled_window_start")
      .eq("company_id", session.company.id)
      .eq("id", input.id)
      .maybeSingle();
    if (currentError || !current) throw new Error("not_found");
    if (current.scheduled_window_start) {
      if (input.reason.length < 3) throw new Error("reschedule_reason_required");
    } else if (!input.reason) {
      payload.reason = "Programación inicial";
    }
  }
  if (input.kind === "payment") payload.kind = input.kind_payment;
  const { data, error } = await createAdminClient().rpc("cej_command", {
    c: session.company.id,
    actor: session.userId,
    kind,
    p: JSON.parse(JSON.stringify(payload)) as Json,
  });
  if (error) throw new Error(error.message);
  return data as {
    id: string;
    folio?: string;
    revision_id?: string;
    revision?: number;
  };
}
