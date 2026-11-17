import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import ImportForm from "./ImportForm";
vi.mock("@/app/panel/configuracion/importaciones/actions", () => ({
  stageWorkbook: vi.fn(),
  promoteImport: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
it("blocks promotion of rows with unresolved issues", () => {
  render(<ImportForm row={{ id: "test", row_hash: "hash" }} blocked />);
  expect(
    screen.getByRole("button", { name: "Promover fila conciliada" }),
  ).toBeDisabled();
  expect(screen.getByRole("checkbox")).toBeRequired();
});
