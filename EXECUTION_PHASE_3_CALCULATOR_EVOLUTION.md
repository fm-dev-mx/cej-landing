# EXECUTION_PHASE_3_CALCULATOR_EVOLUTION.md

## 1. Summary & Scope

Objective: Enable "Expert Mode" capabilities. The current store supports viewMode, but UI features like "Additives" (extra cost items) and "Slump" selection are missing.

In-Scope: Additives logic in Pricing Engine, Expert Mode UI toggle, New Form Components, Test Updates.

Out-of-Scope: User Authentication.

## 2. Dependencies

- Phase 1 (Hardening) complete.

## 3. Task Plan (Checklist)

### 3.1. Pricing Engine Upgrade

- [ ]  **Create `config/additives.ts`:** Define catalog (e.g., `id: 'fiber'`, `price: 150`, `label: 'Fibra de refuerzo'`).
- [ ]  **Update `lib/pricing.ts`:**
    - Modify `calcQuote` to accept `additives: string[]`.
    - Calculate `additivesTotal` = sum(additive price * billedM3).
    - Update `total` = `subtotal` + `additivesTotal` + `vat`.
- [ ]  **Update Tests (Critical):** Update `lib/pricing.test.ts` to accommodate the new function signature and verify additive math.

### 3.2. Store & Schema Updates

- [ ]  **Update Types:** Modify `CalculatorState` in `components/Calculator/types.ts` to include `selectedAdditives: string[]`.
- [ ]  **Update Store:** Add `toggleAdditive(id)` action to `useCejStore`.

### 3.3. UI Implementation

- [ ]  **Wire up `ExpertToggle.tsx`:** Ensure clicking it updates the store's `viewMode`.
- [ ]  **Create `AdditivesForm.tsx`:**
    - Render only when `viewMode === 'expert'`.
    - Use `SelectionCard` (checkbox variant) to allow multiple selections.
- [ ]  **Update `CalculatorSummary.tsx`:** Display a dedicated row for "Aditivos" if any are selected.

## 4. Definition of Done (DoD)

- User can toggle "Modo Experto".
- Selecting "Fibra" increases the total price correctly based on volume.
- The WhatsApp message generated includes the list of selected additives.
- **All existing tests pass** (no regressions in basic calc).

## 5. Instructions for Prompting

```text
Act as a Full Stack React Developer. We are in PHASE 3.
Context: We are adding 'Additives' (Extras) to the calculator.
1. Define a constant 'ADDITIVES' in 'config/business.ts'.
2. Update 'lib/pricing.ts' -> 'calcQuote' to handle an array of additive IDs.
3. IMPORTANT: Update 'lib/pricing.test.ts' to match the new signature and add a test case for additives.
4. Update the Zustand store types and actions to support 'selectedAdditives'.
5. Create 'components/Calculator/steps/forms/AdditivesForm.tsx' that allows multi-selection.
Constraint: Do NOT add new CSS frameworks. Use the existing SCSS modules.
Output the updated business config, pricing logic, tests, and the new component.
