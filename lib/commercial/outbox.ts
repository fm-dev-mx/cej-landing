import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import {
  sendTestEvent,
  type TestDestination,
  type TestTransport,
} from "./marketing";
// Only test destinations are supported. There is no production dispatcher in this increment.
export async function dispatchTestOutbox(
  db: SupabaseClient<Database>,
  companyId: string,
  destination: TestDestination,
  transport: TestTransport,
) {
  const { data: config, error: ce } = await db
    .from("marketing_destinations")
    .select("*")
    .eq("company_id", companyId)
    .single();
  if (
    ce ||
    !config?.enabled ||
    !config.verified ||
    !config.test_only ||
    config.dataset_id !== destination.datasetId ||
    config.api_version !== destination.apiVersion
  )
    throw new Error("test_destination_not_verified");
  const { data: rows, error } = await db.rpc("cej_lease_test_outbox", {
    c: companyId,
    max_items: 10,
  });
  if (error) throw new Error("outbox_lease_failed");
  const results: { id: string; status: string }[] = [];
  for (const row of rows ?? []) {
    let update: Database["public"]["Tables"]["marketing_outbox"]["Update"];
    try {
      if (!row.payload) throw new Error("eligibility_missing");
      const receipt = await sendTestEvent(destination, row.payload, transport);
      update = {
        status: "accepted",
        api_receipt: {
          events_received: receipt.events_received,
          trace_id: receipt.traceId ?? null,
        } as Json,
        last_error: null,
        leased_until: null,
      };
    } catch {
      update = {
        status: row.attempts >= 5 ? "dead" : "retry",
        last_error: "test_delivery_failed",
        leased_until: null,
        next_attempt_at: new Date(
          Date.now() + Math.min(3600, 2 ** row.attempts * 30) * 1000,
        ).toISOString(),
      };
    }
    const { data: updated, error: ue } = await db
      .from("marketing_outbox")
      .update(update)
      .eq("id", row.id)
      .eq("company_id", companyId)
      .eq("attempts", row.attempts)
      .eq("status", "processing")
      .select("id");
    if (ue) throw new Error("outbox_receipt_failed");
    results.push({
      id: row.id,
      status: updated?.length ? String(update.status) : "lease_superseded",
    });
  }
  return results;
}
