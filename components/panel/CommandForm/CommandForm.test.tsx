import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, expect, it } from "vitest";
import CommandForm from "./CommandForm";
const submit = vi.hoisted(() => vi.fn());
vi.mock("@/app/panel/actions", () => ({ submitCommand: submit }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
it("keeps captured values after a persistence failure and shows the correction", async () => {
  submit.mockResolvedValue({
    ok: false,
    message: "Revisa los campos.",
    fields: { name: "Indica un nombre." },
  });
  render(
    <CommandForm
      kind="customer"
      fields={[{ name: "name", label: "Nombre" }]}
      label="Guardar cliente"
    />,
  );
  fireEvent.change(screen.getByLabelText("Nombre"), {
    target: { value: "Cliente sintético" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar cliente" }));
  await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(2));
  expect(screen.getByLabelText("Nombre")).toHaveValue("Cliente sintético");
  expect(submit).toHaveBeenCalledWith({
    kind: "customer",
    name: "Cliente sintético",
  });
});
