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

const windowFields = [
  { name: "start", label: "Inicio", type: "datetime-local" as const },
  {
    name: "acknowledge_conflicts",
    label: "Confirmo el cruce",
    type: "checkbox" as const,
    showOnConflict: true,
  },
];
const overlap = {
  ok: false,
  code: "schedule_overlap",
  message: "Choca.",
  conflicts: [
    {
      id: "o1",
      folio: "F-1",
      start: "2026-01-01T10:00:00Z",
      end: "2026-01-01T12:00:00Z",
    },
  ],
};

it("drops the conflict list and the confirm box when the window changes", async () => {
  submit.mockResolvedValue(overlap);
  render(<CommandForm kind="schedule" fields={windowFields} label="Guardar" />);
  expect(screen.queryByLabelText("Confirmo el cruce")).toBeNull();
  fireEvent.change(screen.getByLabelText("Inicio"), {
    target: { value: "2026-01-01T10:00" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  const box = await screen.findByLabelText("Confirmo el cruce");
  fireEvent.click(box);
  fireEvent.change(screen.getByLabelText("Inicio"), {
    target: { value: "2026-01-02T10:00" },
  });
  expect(screen.queryByLabelText("Confirmo el cruce")).toBeNull();
  expect(screen.queryByText("F-1")).toBeNull();
});

it("shows a retry message, not a confirm box, when conflicts could not be read", async () => {
  submit.mockResolvedValue({
    ok: false,
    code: "schedule_overlap_unverified",
    message: "No pudimos cargar cuál. Vuelve a guardar.",
  });
  render(<CommandForm kind="schedule" fields={windowFields} label="Guardar" />);
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Vuelve a guardar");
  expect(screen.queryByLabelText("Confirmo el cruce")).toBeNull();
});
