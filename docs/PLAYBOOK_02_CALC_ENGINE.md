# Playbook 02: Expert Engine (Pricing Evolution)

**Status:** ✅ COMPLETED
**Date:** December 2025
**Outcome:** Dynamic Pricing Engine Active with Additives Support

## 1. Context & Achievements

We successfully decoupled the pricing logic from the static code. The calculator now operates on a **Dependency Injection** model, accepting a `PricingRules` object that dictates base prices, volumetric tiers, and additives availability.

**Key Deliverables:**
- **Dynamic Core:** `calcQuote` accepts external rules (DB-ready).
- **Hybrid Persistence:** Leads now store the exact configuration snapshot used at calculation time (`pricing_version: 2`).
- **Expert UI:** Toggleable interface for advanced users (Additives).

## 2. Technical Implementation Summary

### 2.1 The Pricing Contract (Schema)
Defined in `lib/schemas/pricing.ts`. Allows strictly typed configuration for:
- Base Prices (Matrix: Type x Strength).
- Volume Tiers (MOQ enforcement).
- Additives Catalog (Supports `per_m3` and `fixed_per_load` models).

### 2.2 State Management (Zustand)
- **Versioning:** Upgraded store to `version: 2`.
- **Migration Strategy:** Added `migrate()` function to `persist` middleware to auto-heal existing `localStorage` data from Phase 1 users, injecting missing fields (`additives: []`).
- **Safety:** Disabling "Expert Mode" automatically clears selected additives to prevent hidden charges.

### 2.3 Fail-Open Architecture 2.0
Implemented via `DEFAULT_PRICING_RULES` in `lib/pricing.ts`.
- **Behavior:** The UI components import this default object. In Phase 3, a Context Provider will attempt to fetch from Supabase; if it fails/timeouts, it falls back to this object instantly.

### 2.4 Data Integrity
Updated `useCheckout.ts` to ensure the payload sent to `submitLead` (Server Action) includes the `additives` array inside the item definition. This ensures the operations team knows exactly what to dispatch.

## 3. Post-Mortem & Next Steps

### Solved Issues
- **Desktop UX:** Added "Mis Pedidos" button to desktop header.
- **Transparency:** `CalculatorSummary` now iterates over `breakdownLines` to show line-item details.
- **Testing:** Fixed regression on label changes ("Total Estimado" -> "Total Neto").

### Ready for Phase 3 (SaaS / DB)
The engine is ready to receive data. The next phase will focus purely on:
1.  Creating the `price_config` table in Supabase.
2.  Running `scripts/seed-pricing.ts`.
3.  Creating the Data Fetching hook (`SWR` or `React Query`) to feed the engine.
