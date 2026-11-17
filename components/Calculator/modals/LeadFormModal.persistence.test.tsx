import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { LeadFormModal } from "./LeadFormModal";
import { useCejStore } from "@/store/useCejStore";
const submit = vi.hoisted(() => vi.fn());
vi.mock("@/app/actions/submitLead", () => ({ submitLead: submit }));
vi.mock("@/hooks/useIdentity", () => ({ useIdentity: () => null }));
beforeEach(() => {
  submit.mockReset();
  useCejStore.setState({
    user: { visitorId: "synthetic", hasConsentedPersistence: false },
  });
});
it("keeps public capture on persistence failure and retries the same business event before announcing success", async () => {
  submit
    .mockResolvedValueOnce({ success: false, error: "No se pudo guardar." })
    .mockResolvedValueOnce({ success: true, id: "123" });
  const success = vi.fn();
  render(
    <LeadFormModal
      isOpen
      onClose={vi.fn()}
      onSuccess={success}
      quoteDetails={{
        summary: { total: 123, volume: 5, product: "200" },
        context: {},
      }}
    />,
  );
  fireEvent.change(screen.getByLabelText("Nombre completo"), {
    target: { value: "Cliente sintético" },
  });
  fireEvent.change(screen.getByLabelText("Teléfono / WhatsApp"), {
    target: { value: "6561234567" },
  });
  const privacy = screen.getByRole("checkbox", { name: /He leído y acepto/ });
  expect(privacy).not.toBeChecked();
  fireEvent.click(privacy);
  fireEvent.click(screen.getByRole("button", { name: "Continuar a WhatsApp" }));
  await screen.findByText("No se pudo guardar.");
  expect(success).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Nombre completo")).toHaveValue(
    "Cliente sintético",
  );
  fireEvent.click(screen.getByRole("button", { name: "Continuar a WhatsApp" }));
  await waitFor(() => expect(success).toHaveBeenCalledTimes(1));
  expect(submit.mock.calls[1][0].fb_event_id).toBe(
    submit.mock.calls[0][0].fb_event_id,
  );
  expect(success).toHaveBeenCalledWith(
    "Cliente sintético",
    submit.mock.calls[0][0].fb_event_id,
  );
});
