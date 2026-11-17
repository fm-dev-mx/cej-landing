import { it, expect, vi } from "vitest";
import {
  prepareBusinessEvent,
  sendTestEvent,
  type BusinessEvent,
} from "./marketing";
const fact: BusinessEvent = {
  companyId: "synthetic",
  factId: "order-1",
  eventId: "sale:order-1",
  name: "Purchase",
  occurredAt: new Date().toISOString(),
  imported: false,
  consent: true,
  customerPhone: "6561234567",
  actionSource: "phone_call",
  amount: 4500,
  currency: "MXN",
};
it("hashes actual customer identity and never creates employee browser matching", () => {
  const result = prepareBusinessEvent(fact);
  expect(result.eligible).toBe(true);
  expect(result.payload?.user_data.ph?.[0]).toMatch(/^[a-f0-9]{64}$/);
  expect(result.payload?.user_data).not.toHaveProperty("client_ip_address");
  expect(result.payload?.event_id).toBe(fact.eventId);
});
it.each([
  { imported: true },
  { consent: false },
  { actionSource: null },
  { customerPhone: null },
  { occurredAt: "2000-01-01T00:00:00Z" },
  { actionSource: "website" as const },
])("keeps an ineligible fact local: %o", (change) =>
  expect(prepareBusinessEvent({ ...fact, ...change }).eligible).toBe(false),
);
it("requires a verified test destination and API acceptance independently of attribution", async () => {
  const transport = vi
    .fn()
    .mockResolvedValue({ httpOk: true, events_received: 1 });
  const destination = {
    datasetId: "synthetic",
    apiVersion: "test",
    testEventCode: "TEST_SYNTHETIC",
    accessToken: "local-synthetic-placeholder",
    verified: true,
    testOnly: true as const,
  };
  await expect(
    sendTestEvent({ ...destination, verified: false }, {}, transport),
  ).rejects.toThrow();
  expect(transport).not.toHaveBeenCalled();
  await sendTestEvent(
    destination,
    prepareBusinessEvent(fact).payload,
    transport,
  );
  expect(transport).toHaveBeenCalledOnce();
  transport.mockResolvedValue({ httpOk: true, events_received: 0 });
  await expect(sendTestEvent(destination, {}, transport)).rejects.toThrow(
    "api_not_accepted",
  );
});
