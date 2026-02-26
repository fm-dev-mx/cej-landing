# Playbook 00: QA & Infrastructure Hardening

**Status:** ✅ ARCHIVED (Completed – Sprint 1)
**Goal:** Eliminate technical debt and ensure 100% reliability of the calculation engine before database integration.

> **Archive Note:** This playbook represents the work completed during Sprint 1. The checklist items below were completed but preserved in their original format for historical reference.

## 1. Scope

The current calculator works for the "Happy Path" but lacks robustness for edge cases. We cannot scale functionality (Additives) on fragile foundations.

- **In-Scope:** Advanced Unit Testing, Accessibility (A11y) Repair, Type Audit.
- **Out-of-Scope:** New Features, UI Redesign, Database.

## 2. Tasks & Specifications

### 2.1 Mathematical Integrity (Crucial)

The pricing engine handles money. It must be deterministic and tested against edge cases.

- [ ]  **Update `lib/pricing.test.ts`:**
  - **Rounding Edge Cases:** Verify that `2.0001` rounds correctly to `2.5` (based on `M3_STEP`).
  - **Minimum Order Quantity (MOQ):** Verify that requesting `1.0 m³` bills for `MIN_M3_BY_TYPE` (2m³ or 3m³).
  - **Float Precision:** Ensure internal calculations use integer cents until the final display formatting to avoid `0.1 + 0.2 = 0.30000004` errors.

### 2.2 Accessibility (A11y) & UX

- [ ]  **Refactor `SelectionCard.tsx`:**
  - **Problem:** Native radio inputs might be `display: none`, breaking keyboard navigation (Tab/Space).
  - **Fix:** Use the `.sr-only` (visually-hidden) pattern. The input must remain in the DOM, focusable, but invisible.
- [ ]  **Focus Management:**
  - Ensure that when "Ayúdame a calcular" is selected, focus flows naturally to the new "Tipo de Obra" field.

### 2.3 Type Safety Audit

- [ ]  **Strict Persistence:**
  - Review `store/useCejStore.ts`. Ensure the `partialize` function explicitly types the returned object, avoiding `any`.
  - *Goal:* Only persist `cart` and `user` preferences. Never persist `isDrawerOpen` or UI transient states.

## 3. Exit Criteria

1. `pnpm test` passes with **100% success rate**.
2. Coverage for `lib/pricing.ts` is > 95%.
3. `SelectionCard` is navigable using only the keyboard.
4. No `any` types found in critical paths (`store`, `pricing`).`
