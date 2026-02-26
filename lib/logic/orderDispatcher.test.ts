import { describe, it, expect, vi, beforeEach } from "vitest";
import { mapQuoteToOrder, mapCartToOrder, dispatchOrder } from "./orderDispatcher";
import { trackLead } from "@/lib/tracking/visitor";
import { submitLead } from "@/app/actions/submitLead";
import type { QuoteBreakdown, CalculatorState, CartItem, OrderPayload } from "@/types/domain";

// --- Mocks ---
vi.mock("uuid", () => ({
    v4: () => "mock-uuid",
}));

vi.mock("@/lib/tracking/visitor", () => ({
    trackLead: vi.fn(),
}));

vi.mock("@/app/actions/submitLead", () => ({
    submitLead: vi.fn(),
}));

describe("orderDispatcher logic", () => {
    const mockCustomer = {
        name: "Test User",
        phone: "1234567890",
    };

    const mockQuote = {
        volume: { billedM3: 5, actualM3: 4.8 },
        strength: 250,
        concreteType: "pumped" as const,
        subtotal: 10000,
        vat: 1600,
        total: 11600,
        breakdownLines: [],
    };

    const mockDraft = {
        additives: ["fiber"],
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("mapQuoteToOrder", () => {
        it("correctly maps a quote to an OrderPayload", () => {
            const result = mapQuoteToOrder("WEB-123", mockCustomer, mockQuote as unknown as QuoteBreakdown, mockDraft as unknown as CalculatorState);

            expect(result.folio).toBe("WEB-123");
            expect(result.customer).toEqual(mockCustomer);
            expect(result.items[0].label).toBe("Concreto Bomba - f'c 250");
            expect(result.items[0].volume).toBe(5);
            expect(result.items[0].additives).toContain("fiber");
            expect(result.financials.total).toBe(11600);
        });
    });

    describe("mapCartToOrder", () => {
        it("correctly aggregates cart items", () => {
            const mockCart = [
                {
                    id: "1",
                    config: { label: "Item 1" },
                    results: { total: 1000, subtotal: 800, vat: 200, volume: { billedM3: 1 }, concreteType: "direct" },
                    inputs: { additives: [] },
                },
                {
                    id: "2",
                    config: { label: "Item 2" },
                    results: { total: 2000, subtotal: 1600, vat: 400, volume: { billedM3: 2 }, concreteType: "pumped" },
                    inputs: { additives: ["waterproofer"] },
                },
            ];

            const result = mapCartToOrder("WEB-999", mockCustomer, mockCart as unknown as CartItem[]);

            expect(result.folio).toBe("WEB-999");
            expect(result.items).toHaveLength(2);
            expect(result.financials.total).toBe(3000);
            expect(result.financials.subtotal).toBe(2400);
            expect(result.items[1].additives).toContain("waterproofer");
        });
    });

    describe("dispatchOrder", () => {
        const mockPayload = {
            folio: "WEB-123",
            financials: { total: 11600 },
        };

        it("tracks and submits the order", async () => {
            vi.mocked(submitLead).mockResolvedValue({ status: "success", id: "lead-id" });

            const result = await dispatchOrder(
                mockCustomer,
                mockPayload as unknown as OrderPayload,
                { visitorId: "vis-1" },
                "fb-evt-1"
            );

            expect(trackLead).toHaveBeenCalledWith(expect.objectContaining({
                event_id: "fb-evt-1",
                value: 11600,
            }));

            expect(submitLead).toHaveBeenCalledWith(expect.objectContaining({
                visitor_id: "vis-1",
                fb_event_id: "fb-evt-1",
            }));

            expect(result).toEqual({ success: true, folio: "WEB-123" });
        });

        it("handles submission errors", async () => {
            vi.mocked(submitLead).mockResolvedValue({
                status: "error",
                message: "Validation failed",
                errors: { phone: ["invalid"] },
            });

            const result = await dispatchOrder(
                mockCustomer,
                mockPayload as unknown as OrderPayload,
                {},
                "fb-evt-1"
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain("Validation failed");
            expect(result.error).toContain("phone");
        });
    });
});
