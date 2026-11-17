import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import PendingData from "./PendingData";
import { pendingData } from "@/lib/commercial/pending";

it("shows each missing fact as «Pendiente» with its reason", () => {
  const items = pendingData({
    company: {
      quote_profile: {},
      profile_verified: false,
      freight_tax: null,
      freight_vat_rate: null,
    },
  });
  render(<PendingData items={items} />);
  expect(screen.getAllByText("Pendiente")).toHaveLength(items.length);
  expect(
    screen.getByText("IVA del flete de Samalayuca ($1,500 por camión)"),
  ).toBeInTheDocument();
  expect(screen.getAllByText(/^Motivo:/)).toHaveLength(items.length);
});

it("renders nothing when no data is missing", () => {
  const { container } = render(<PendingData items={[]} />);
  expect(container).toBeEmptyDOMElement();
});
