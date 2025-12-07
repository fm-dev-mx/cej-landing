# EXECUTION_PHASE_1_QA_HARDENING.md

## 1. Summary & Scope

Objective: Secure the mathematical core of the application and improve accessibility before integrating the database. The calculator is the primary value driver; regressions here are unacceptable.

In-Scope: Unit Testing expansion, Accessibility (a11y) improvements, strict type auditing.

Out-of-Scope: Database connection, UI Redesign.

## 2. Dependencies

- Access to `lib/pricing.ts` and `vitest.config.mts`.
- Existing `components/Calculator` code.

## 3. Task Plan (Checklist)

### 3.1. Advanced Logic Testing

- [ ]  **Refactor `lib/pricing.test.ts`:**
    - Add test cases for the "Minimum Order" logic (e.g., verifying that requesting 1.5m³ bills for 2m³ or 3m³ depending on the service).
    - Add test cases for rounding edge cases (e.g., `2.0001` should round to `2.5`).
- [ ]  **Integration Test:** Create `components/Calculator/CalculatorIntegration.test.tsx` to simulate a user flow:
    - *Select "Ayúdame a calcular" -> Select "Losa" -> Enter Dims -> Verify Total.*

### 3.2. Accessibility Audit (ARIA)

- [ ]  **Review `CalculatorForm.tsx`:** Ensure dynamic sections (like `AssistVolumeForm`) manage focus correctly when they appear.
- [ ]  **Enhance `SelectionCard.tsx`:** Ensure the radio inputs inside the cards are fully keyboard navigable (`Tab`, `Space` to select). Use `visually-hidden` utility for the native radio input instead of `display: none`.

### 3.3. Type Safety

- [ ]  **Audit `store/useCejStore.ts`:**
    - Check `any` usage in `partialize` configuration.
    - Ensure `QuoteBreakdown` is perfectly aligned with `OrderPayload` in `types/order.ts`.

## 4. Definition of Done (DoD)

- `pnpm test` passes with 100% success rate.
- Coverage for `lib/pricing.ts` is >95%.
- Keyboard navigation works seamlessly in the Calculator form.
- No TypeScript linting errors (`pnpm lint`).

## 5. Instructions for Prompting

```text
Act as a QA Engineer and Frontend Specialist. We are in PHASE 1.
Context: We need to harden the 'cej-landing' calculator logic.
1. Analyze 'lib/pricing.ts' and expand 'lib/pricing.test.ts' to cover minimum order quantities and rounding edge cases.
2. Refactor 'components/ui/SelectionCard/SelectionCard.tsx' to ensure the native input is visually hidden but keyboard accessible (do not use display: none).
3. Run a type check on 'store/useCejStore.ts' to ensure persistence is typed correctly.
Output the code changes for the tests and the SelectionCard component.
