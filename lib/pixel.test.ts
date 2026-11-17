import { it, expect, vi } from "vitest";
import { trackLead } from "./pixel";
it("uses the Pixel fourth-argument eventID for the same persisted Lead fact", () => {
  const fbq = vi.fn();
  window.fbq = fbq;
  trackLead({
    value: 100,
    currency: "MXN",
    content_name: "Solicitud sintética",
    event_id: "same-business-fact",
  });
  expect(fbq).toHaveBeenCalledWith(
    "track",
    "Lead",
    expect.not.objectContaining({ event_id: expect.anything() }),
    { eventID: "same-business-fact" },
  );
  delete window.fbq;
});
