import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useLeadSubmission } from "./useLeadSubmission";
const submit = vi.hoisted(() => vi.fn());
vi.mock("@/app/actions/submitLead", () => ({ submitLead: submit }));
it("guards concurrent submissions and preserves a stable ID after an ambiguous network failure", async () => {
  let reject!: (reason: Error) => void;
  submit
    .mockImplementationOnce(
      () =>
        new Promise((_resolve, fail) => {
          reject = fail;
        }),
    )
    .mockResolvedValueOnce({ success: true, id: "42" });
  const { result } = renderHook(() => useLeadSubmission());
  const payload = {
    name: "Cliente sintético",
    phone: "6561234567",
    quote: { total: 10 },
    privacy_accepted: true as const,
  };
  await act(async () => {
    const first = result.current.submit(payload);
    expect(await result.current.submit(payload)).toBeNull();
    reject(new Error("network"));
    expect(await first).toBeNull();
  });
  expect(submit).toHaveBeenCalledTimes(1);
  expect(result.current.error).toContain("conexión");
  await act(async () => {
    expect(await result.current.submit(payload)).toMatchObject({ id: "42" });
  });
  expect(submit.mock.calls[1][0].fb_event_id).toBe(
    submit.mock.calls[0][0].fb_event_id,
  );
});
