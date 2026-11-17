import "server-only";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/requirePermission";
import { panelConfigured, createAdminClient } from "@/lib/supabase/server";
import type { QuoteDocument, QuoteSnapshot } from "./quote";
import { pendingData } from "./pending";
import type { Database } from "@/types/database";

export async function panelSession() {
  if (!panelConfigured()) redirect("/login?setup=1");
  try {
    return await requirePermission("read");
  } catch (error) {
    if (error instanceof Error && error.message === "unauthenticated")
      redirect("/login");
    if (error instanceof Error && error.message === "permission_denied")
      redirect("/login?access=1");
    throw error;
  }
}
/**
 * Missing business facts for the session's company. The Meta destination is
 * readable by owners and admins only (RLS), so other roles get no claim about
 * it rather than a false «no registrado». Source-workbook control totals have
 * no storage yet, so they stay pending.
 */
export async function loadPendingData(s: {
  db: Awaited<ReturnType<typeof requirePermission>>["db"];
  company: Awaited<ReturnType<typeof requirePermission>>["company"];
  role: string;
}) {
  const canReadDestination = ["owner", "admin"].includes(s.role);
  let destination = null;
  if (canReadDestination) {
    const { data, error } = await s.db
      .from("marketing_destinations")
      .select("dataset_id,api_version,verified,enabled")
      .eq("company_id", s.company.id)
      .maybeSingle();
    if (error) throw new Error("read_failed");
    destination = data;
  }
  const items = pendingData({
    company: s.company,
    destination,
    sourceTotals: null,
  });
  return canReadDestination
    ? items
    : items.filter((i) => i.key !== "meta_destination");
}
export async function loadTeam() {
  const s = await requirePermission("read");
  // Profiles are self-read under RLS. Expose only active colleagues of the verified company.
  const db = createAdminClient();
  const { data: memberships, error } = await db
    .from("company_memberships")
    .select("user_id")
    .eq("company_id", s.company.id)
    .eq("active", true);
  if (error) throw new Error("read_failed");
  const ids = (memberships ?? []).map((m) => m.user_id);
  if (!ids.length) return [];
  const { data: profiles, error: pe } = await db
    .from("profiles")
    .select("id,full_name,email")
    .in("id", ids);
  if (pe) throw new Error("read_failed");
  return ids.map((id) => {
    const profile = profiles?.find((p) => p.id === id);
    return {
      value: id,
      label: profile?.full_name || profile?.email || "Miembro del equipo",
    };
  });
}
export async function loadChoices(
  input: {
    customerTerm?: string;
    projectTerm?: string;
    customerId?: string;
    projectId?: string;
  } = {},
) {
  const s = await requirePermission("read");
  const clean = (term = "") =>
    term.replace(/[^\p{L}\p{N}\s+\-]/gu, "").slice(0, 100);
  const term = clean(input.customerTerm);
  let customerQuery = s.db
    .from("customers")
    .select("id,display_name,primary_phone_norm", { count: "exact" })
    .eq("company_id", s.company.id);
  if (term)
    customerQuery = customerQuery.or(
      `display_name.ilike.%${term}%,primary_phone_norm.ilike.%${term}%${input.customerId ? `,id.eq.${input.customerId}` : ""}`,
    );
  else if (input.customerId)
    customerQuery = customerQuery.eq("id", input.customerId);
  let projectQuery = s.db
    .from("projects")
    .select("id,customer_id,name,address", { count: "exact" })
    .eq("company_id", s.company.id)
    .eq(
      "customer_id",
      input.customerId ?? "00000000-0000-0000-0000-000000000000",
    );
  const projectTerm = clean(input.projectTerm);
  if (projectTerm)
    projectQuery = projectQuery.or(
      `name.ilike.%${projectTerm}%${input.projectId ? `,id.eq.${input.projectId}` : ""}`,
    );
  else if (input.projectId)
    projectQuery = projectQuery.eq("id", input.projectId);
  const [customers, projects] = await Promise.all([
    customerQuery.order("display_name").limit(50),
    projectQuery.order("name").limit(50),
  ]);
  if (customers.error || projects.error) throw new Error("read_failed");
  return {
    session: s,
    customers: customers.data ?? [],
    projects: projects.data ?? [],
    customerCount: customers.count ?? 0,
    projectCount: projects.count ?? 0,
  };
}
export async function listOrders(params: Record<string, string | undefined>) {
  const s = await panelSession();
  const page = Math.max(
    1,
    Math.min(100000, Math.trunc(Number(params.page) || 1)),
  );
  const term = (params.q ?? "")
    .replace(/[^\p{L}\p{N}\s+\-]/gu, "")
    .slice(0, 100);
  const state =
    params.status &&
    [
      "draft",
      "confirmed",
      "scheduled",
      "in_progress",
      "completed",
      "cancelled",
    ].includes(params.status)
      ? params.status
      : "";
  const { data, error } = await s.db.rpc("cej_search_orders", {
    c: s.company.id,
    term,
    state,
    page_number: page,
  });
  if (error) throw new Error("read_failed");
  type Order = Database["public"]["Tables"]["orders"]["Row"] & {
    customers: {
      display_name: string | null;
      primary_phone_norm: string | null;
    };
  };
  const result = data as unknown as { orders: Order[]; total: number };
  return { orders: result.orders, total: result.total, page };
}
export async function loadQuoteDocument(
  id: string,
  revisionId?: string,
): Promise<
  QuoteDocument & {
    id: string;
    revisionId: string;
    customerId: string | null;
    projectId: string | null;
    currentRevision: number;
    leadId: number | null;
  }
> {
  const s = await panelSession();
  const { data: q, error } = await s.db
    .from("quotes")
    .select("*,customers(display_name),projects(name)")
    .eq("id", id)
    .eq("company_id", s.company.id)
    .single();
  if (error || !q) throw new Error("not_found");
  let rq = s.db
    .from("quote_revisions")
    .select("*")
    .eq("quote_id", id)
    .eq("company_id", s.company.id);
  rq = revisionId
    ? rq.eq("id", revisionId)
    : rq.eq("revision", q.current_revision);
  const { data: revision, error: re } = await rq.single();
  if (re || !revision) throw new Error("not_found");
  const { data: approval, error: ae } = await s.db
    .from("quote_approvals")
    .select("revision_id")
    .eq("revision_id", revision.id)
    .eq("company_id", s.company.id)
    .maybeSingle();
  if (ae) throw new Error("read_failed");
  const snapshot = revision.snapshot as unknown as QuoteSnapshot;
  return {
    id: q.id,
    folio: q.folio,
    revision: revision.revision,
    currentRevision: q.current_revision,
    revisionId: revision.id,
    snapshot,
    approved: Boolean(approval),
    customer: snapshot.customer,
    project: snapshot.project,
    customerId: revision.customer_id,
    projectId: revision.project_id,
    leadId: revision.lead_id,
  };
}
