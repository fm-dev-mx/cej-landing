import { render, screen, fireEvent } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import QuoteExports from "./QuoteExports";
it("copies the persisted text and prepares a manual share without submitting a business event", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  render(<QuoteExports text="Folio C-TEST Total $4,500.00" url="/export" />);
  fireEvent.click(screen.getByRole("button", { name: "Copiar texto" }));
  expect(writeText).toHaveBeenCalledWith("Folio C-TEST Total $4,500.00");
  expect(
    screen.getByRole("link", { name: "Preparar WhatsApp" }),
  ).toHaveAttribute(
    "href",
    `https://wa.me/?text=${encodeURIComponent("Folio C-TEST Total $4,500.00")}`,
  );
  expect(await screen.findByRole("status")).toHaveTextContent("Texto copiado.");
});
