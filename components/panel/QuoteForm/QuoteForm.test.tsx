import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import QuoteForm from "./QuoteForm";

const submit = vi.hoisted(() => vi.fn());
const preview = vi.hoisted(() => vi.fn());
const lookup = vi.hoisted(() => vi.fn());

vi.mock("@/app/panel/actions", () => ({
  submitCommand: submit,
  previewQuote: preview,
  lookupQuoteChoices: lookup,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("QuoteForm", () => {
  it("saves a generic quote without creating a customer or lead", async () => {
    submit.mockResolvedValue({ ok: false, message: "Prueba sin persistencia" });
    preview.mockResolvedValue({
      ok: true,
      subtotal: 25000,
      vat: 2000,
      total: 27000,
      pending_tax: false,
    });
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

  it("shows live preview of subtotal, IVA and total, and shows provisional total when volume is missing", async () => {
    preview.mockResolvedValue({
      ok: true,
      subtotal: 25000,
      vat: 2000,
      total: 27000,
      pending_tax: false,
    });
    render(<QuoteForm customers={[]} projects={[]} />);
    // Initially volume is empty, so it displays provisional total with missing volume notice
    expect(
      screen.getByText(/Total provisional: falta indicar el volumen/i),
    ).toBeInTheDocument();

    // Enter volume
    fireEvent.change(screen.getByLabelText("Volumen solicitado (m³)"), {
      target: { value: "14" },
    });

    await waitFor(() => expect(preview).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.getByText(/Subtotal:/i)).toBeInTheDocument();
      expect(screen.getByText(/IVA:/i)).toBeInTheDocument();
      expect(screen.getByText(/^Total:/i)).toBeInTheDocument();
    });
  });

  it("searches customer with Enter, allows keyboard navigation, and auto-fills customer and obra", async () => {
    lookup.mockResolvedValue({
      customers: [
        {
          id: "c1",
          display_name: "Constructora Norte",
          primary_phone_norm: "6561112233",
        },
      ],
      projects: [
        {
          id: "p1",
          customer_id: "c1",
          name: "Obra Principal",
          address: "Av. Siempre Viva 123",
        },
      ],
      customerCount: 1,
      projectCount: 1,
    });

    render(
      <QuoteForm
        customers={[]}
        projects={[]}
        customerCount={0}
        projectCount={0}
      />,
    );

    // Switch to formal mode
    fireEvent.change(screen.getByLabelText("Tipo de cotización"), {
      target: { value: "formal" },
    });

    const searchInput = screen.getByLabelText(
      "Buscar cliente por nombre o teléfono",
    );
    fireEvent.change(searchInput, { target: { value: "Norte" } });
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });

    await waitFor(() => expect(lookup).toHaveBeenCalled());

    // When single result returned, customer is auto-selected and obra auto-filled
    await waitFor(() => {
      const customerSelect = screen.getByRole("combobox", { name: "Cliente" });
      expect(customerSelect).toHaveValue("c1");
      const projectSelect = screen.getByRole("combobox", { name: "Obra" });
      expect(projectSelect).toHaveValue("p1");
    });
  });

  it("displays 'Refina la búsqueda' note ONLY when total count is greater than displayed count", () => {
    const { rerender } = render(
      <QuoteForm
        customers={[
          { id: "c1", display_name: "Cliente 1", primary_phone_norm: null },
        ]}
        projects={[]}
        customerCount={1}
        projectCount={0}
      />,
    );

    // Switch to formal mode
    fireEvent.change(screen.getByLabelText("Tipo de cotización"), {
      target: { value: "formal" },
    });

    // 1 de 1 -> should NOT show "Refina la búsqueda"
    expect(screen.getByText(/Clientes: 1 de 1\./i)).toBeInTheDocument();
    expect(
      screen.queryByText(/Refina la búsqueda si faltan resultados/i),
    ).not.toBeInTheDocument();

    // Rerender with 1 of 5 -> should show "Refina la búsqueda"
    rerender(
      <QuoteForm
        customers={[
          { id: "c1", display_name: "Cliente 1", primary_phone_norm: null },
        ]}
        projects={[]}
        customerCount={5}
        projectCount={0}
      />,
    );
    expect(screen.getByText(/Clientes: 1 de 5\./i)).toBeInTheDocument();
    expect(
      screen.getByText(/Refina la búsqueda si faltan resultados/i),
    ).toBeInTheDocument();
  });

  it("shows Samalayuca fields and plain language explanation only when zone is Samalayuca", () => {
    render(<QuoteForm customers={[]} projects={[]} />);

    // In local zone by default
    expect(
      screen.queryByLabelText(/Capacidad de referencia/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Tarifa de flete Samalayuca/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/ceil\(volumen/i)).not.toBeInTheDocument();

    // Switch to Samalayuca
    fireEvent.change(screen.getByLabelText("Zona"), {
      target: { value: "samalayuca" },
    });

    expect(
      screen.getByLabelText(/Capacidad de referencia/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Tarifa de flete Samalayuca/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/camiones necesarios según volumen y capacidad/i),
    ).toBeInTheDocument();
  });

  it("handles specific authorization errors with aria-invalid and preserves captured input", async () => {
    submit.mockResolvedValue({
      ok: false,
      message: "Este descuento necesita autorización de un administrador.",
      fields: {
        "input.discount":
          "Este descuento necesita autorización de un administrador.",
      },
    });

    render(<QuoteForm customers={[]} projects={[]} />);

    const volumeInput = screen.getByLabelText("Volumen solicitado (m³)");
    fireEvent.change(volumeInput, { target: { value: "14" } });

    const discountInput = screen.getByLabelText(
      "Descuento en concreto y fibra (MXN)",
    );
    fireEvent.change(discountInput, { target: { value: "500" } });

    fireEvent.click(screen.getByRole("button", { name: "Guardar cotización" }));

    await waitFor(() => {
      expect(
        screen.getAllByText(
          "Este descuento necesita autorización de un administrador.",
        ).length,
      ).toBeGreaterThanOrEqual(1);
      expect(discountInput).toHaveAttribute("aria-invalid", "true");
      // Preserved values
      expect(volumeInput).toHaveValue(14);
      expect(discountInput).toHaveValue(500);
    });
  });
});
