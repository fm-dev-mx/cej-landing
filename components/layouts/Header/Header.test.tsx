import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Header from "./Header";

// Mock dependencies
vi.mock("./useHeaderLogic", () => ({
    useHeaderLogic: () => ({
        state: { isScrolled: false, activeSectionId: "hero", isMenuOpen: false },
        data: {
            navItems: [],
            waHref: "https://wa.me/123",
            phoneMeta: { href: "tel:123", display: "123" }
        },
        actions: { toggleMenu: vi.fn(), closeMenu: vi.fn() }
    })
}));

vi.mock("@/store/useCejStore", () => ({
    useCejStore: vi.fn((selector) => selector({ cart: [] }))
}));

// Mock Auth to ensure it's not being used anymore
vi.mock("@/components/Auth", () => ({
    useAuth: vi.fn(() => ({ user: null, loading: false })),
    UserProfileMenu: () => <div data-testid="user-profile-menu" />
}));

describe("Header Component", () => {
    it("does not render a login link in the public header", () => {
        render(<Header />);
        expect(screen.queryByRole("link", { name: /iniciar sesión/i })).toBeNull();
    });

    it("does not render UserProfileMenu", () => {
        render(<Header />);
        expect(screen.queryByTestId("user-profile-menu")).toBeNull();
    });

    it("renders the WhatsApp button", () => {
        render(<Header />);
        const waButtons = screen.getAllByText(/WhatsApp/i);
        expect(waButtons.length).toBeGreaterThan(0);
    });

    it("renders the history/cart button", () => {
        render(<Header />);
        expect(screen.getByRole("button", { name: /Ver mis pedidos/i })).toBeDefined();
    });
});
