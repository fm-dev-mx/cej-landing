import { createHash } from "node:crypto";
import { normalizePhone } from "./schemas";
export interface BusinessEvent {
  companyId: string;
  factId: string;
  eventId: string;
  name: "Lead" | "Purchase";
  occurredAt: string;
  imported: boolean;
  consent: boolean;
  customerPhone?: string | null;
  customerEmail?: string | null;
  actionSource:
    "website" | "phone_call" | "physical_store" | "chat" | "other" | null;
  customerSourceUrl?: string | null;
  customerUserAgent?: string | null;
  customerIp?: string | null;
  customerFbp?: string | null;
  customerFbc?: string | null;
  amount?: number;
  currency?: "MXN";
}
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
export function prepareBusinessEvent(fact: BusinessEvent, now = new Date()) {
  const reasons: string[] = [];
  if (fact.imported) reasons.push("historical_import");
  if (!fact.consent) reasons.push("customer_permission_missing");
  if (!fact.actionSource) reasons.push("customer_channel_unknown");
  const eventTime = Math.floor(new Date(fact.occurredAt).getTime() / 1000),
    nowTime = Math.floor(now.getTime() / 1000);
  if (
    !Number.isFinite(eventTime) ||
    eventTime > nowTime ||
    eventTime < nowTime - 7 * 86400
  )
    reasons.push("event_time_outside_window");
  const userData: Record<string, string[]> = {};
  if (fact.customerPhone) {
    try {
      const phone = normalizePhone(fact.customerPhone);
      if (phone) userData.ph = [sha(phone)];
    } catch {
      reasons.push("customer_phone_invalid");
    }
  }
  if (
    fact.customerEmail &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fact.customerEmail.trim())
  )
    userData.em = [sha(fact.customerEmail.trim().toLowerCase())];
  if (!userData.ph && !userData.em) reasons.push("customer_matching_missing");
  if (
    fact.actionSource === "website" &&
    (!fact.customerSourceUrl || !fact.customerUserAgent)
  )
    reasons.push("website_customer_context_missing");
  if (
    fact.name === "Purchase" &&
    (fact.amount === undefined ||
      !Number.isFinite(fact.amount) ||
      fact.amount < 0 ||
      fact.currency !== "MXN")
  )
    reasons.push("sale_value_missing");
  if (reasons.length)
    return { eligible: false as const, reasons, payload: null };
  return {
    eligible: true as const,
    reasons,
    payload: {
      event_name: fact.name,
      event_id: fact.eventId,
      event_time: eventTime,
      action_source: fact.actionSource,
      user_data: {
        ...userData,
        ...(fact.actionSource === "website"
          ? {
              client_user_agent: fact.customerUserAgent,
              client_ip_address: fact.customerIp,
            }
          : {}),
        ...(fact.customerFbp ? { fbp: fact.customerFbp } : {}),
        ...(fact.customerFbc ? { fbc: fact.customerFbc } : {}),
      } as Record<string, string | string[] | null | undefined>,
      ...(fact.actionSource === "website"
        ? { event_source_url: fact.customerSourceUrl }
        : {}),
      ...(fact.name === "Purchase"
        ? { custom_data: { value: fact.amount, currency: fact.currency } }
        : {}),
    },
  };
}
export interface TestDestination {
  datasetId: string;
  apiVersion: string;
  testEventCode: string;
  accessToken: string;
  verified: boolean;
  testOnly: true;
}
export interface ApiReceipt {
  httpOk: boolean;
  events_received?: number;
  traceId?: string;
}
export type TestTransport = (
  destination: TestDestination,
  payload: unknown,
) => Promise<ApiReceipt>;
export async function sendTestEvent(
  config: TestDestination,
  payload: unknown,
  transport: TestTransport,
) {
  if (
    !config.testOnly ||
    !config.verified ||
    !config.datasetId ||
    !config.apiVersion ||
    !config.testEventCode ||
    !config.accessToken
  )
    throw new Error("test_destination_not_verified");
  const receipt = await transport(config, {
    data: [payload],
    test_event_code: config.testEventCode,
  });
  if (!receipt.httpOk || receipt.events_received !== 1)
    throw new Error("api_not_accepted");
  // Acceptance is an API receipt, never a claim of attribution or campaign results.
  return receipt;
}
