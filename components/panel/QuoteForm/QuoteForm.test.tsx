import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import QuoteForm from "./QuoteForm";
const submit = vi.hoisted(() => vi.fn());
vi.mock("@/app/panel/actions", () => ({ submitCommand: submit }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
it("saves a generic quote without creating a customer or lead", async () => {
  submit.mockResolvedValue({ ok: false, message: "Prueba sin persistencia" });
  render(<QuoteForm customers={[]} projects={[]} />);
  expect(screen.queryByLabelText("Cliente")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Volumen solicitado (m³)"), {
    target: { value: "14" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar cotización" }));
  await waitFor(() => expect(submit).toHaveBeenCalled());
  expect(submit.mock.calls[0][0]).toMatchObject({
    kind: "quote",
    input: { volume: 14, mode: "generic" },
  });
  expect(submit.mock.calls[0][0]).not.toHaveProperty("customer_id");
});
