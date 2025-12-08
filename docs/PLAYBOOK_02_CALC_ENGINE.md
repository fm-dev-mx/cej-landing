# Playbook 02: Expert Engine (Pricing Evolution)

**Status:** ✅ COMPLETED
**Date:** December 8, 2025
**Outcome:** Dynamic Pricing Engine Active with Additives Support

## 1. Context & Achievements

We successfully decoupled the pricing logic from the static code. The calculator now operates on a **Dependency Injection** model, accepting a `PricingRules` object that dictates base prices, volumetric tiers, and additives availability.

**Key Deliverables:**
- **Dynamic Core:** `calcQuote` function refactored to accept external pricing rules (Database-ready).
- **Hybrid Persistence:** Lead payloads now include a specific `pricing_version` snapshot and detailed line items for additives.
- **Expert UI:** Toggleable interface for advanced users to select additives (e.g., Fiber, Accelerant).

## 2. Technical Implementation Summary

### 2.1 The Pricing Contract (Schema)
Defined in `lib/schemas/pricing.ts`. We use **Zod** to strictly validate configuration objects, ensuring runtime safety for:
- **Base Prices:** Matrix of `ConcreteType` x `Strength`.
- **Volume Tiers:** Logic for Minimum Order Quantities (MOQ) and price breaks.
- **Additives Catalog:** Support for `per_m3` (volumetric) and `fixed_per_load` (service) pricing models.

### 2.2 State Management (Zustand)
- **Versioning:** Upgraded store to `version: 2`.
- **Migration Strategy:** Added a `migrate()` function to the `persist` middleware. This auto-heals `localStorage` data from Phase 1 users by injecting missing fields (`additives: []`), preventing hydration crashes.
- **Safety Logic:** Disabling "Expert Mode" automatically clears selected additives to prevent hidden charges in the cart.

### 2.3 Fail-Open Architecture 2.0
Implemented via `DEFAULT_PRICING_RULES` in `lib/pricing.ts`.
- **Behavior:** The application imports this default object as a fallback. In Phase 3, the Data Fetching layer will attempt to load rules from Supabase; if that fails or timeouts, this local configuration takes over instantly.

### 2.4 Data Integrity & UX
- **Persistence:** Updated `useCheckout.ts` to ensure the `additives` array is included in the JSONB payload sent to `submitLead`.
- **Transparency:** The `CalculatorSummary` component now iterates over a generated `breakdownLines` array, displaying every cost component (Base Concrete + Additives + VAT) explicitly to the user.

## 3. Post-Mortem & Next Steps

### Solved Issues during Execution
- **Desktop Accessibility:** Added a "My Orders" button to the Desktop Header to expose the history drawer, previously accessible only on mobile.
- **Visual Regression:** Fixed label inconsistencies ("Total Estimado" vs "Total Neto") in integration tests.
- **Hydration Errors:** Resolved `undefined` property access errors by implementing defensive coding in the Store actions.

### Ready for Phase 3 (Marketing Ops)
The engine is fully prepared to receive external data. The transition to the next phase involves:
1.  Creating the `price_config` table in Supabase.
2.  Running the `scripts/seed-pricing.ts` utility.
3.  Implementing the Data Fetching hook (`SWR` or `React Query`) to feed the engine.
