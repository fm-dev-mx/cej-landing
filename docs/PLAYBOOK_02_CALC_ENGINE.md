# Playbook 02: Expert Engine (Pricing Evolution)

**Status:** Planned
**Context:** Upgrading the math core to support complex construction needs (Additives & Slump).

## 1. The Challenge: Dynamic vs. Static

We need dynamic pricing (database) but must maintain the "Fail-Open" guarantee (static fallback).

**Solution:** A shared Zod Schema acting as a contract between the DB and the Code.

## 2. Implementation Specs

### 2.1 The Pricing Contract

Create `types/pricing.ts` to define the schema strictly.

```tsx
// Example Structure
export type PricingRules = {
  basePrice: Record<ConcreteType, Record<Strength, number>>;
  additives: Record<string, { label: string; price: number }>;
  slumpSurcharges: Record<string, number>; // e.g. "14": 150
  version: number;
};`
```

### 2.2 Database Migration

- Create table `public.pricing_config`:
    - `id`: uuid (PK)
    - `active`: boolean
    - `config`: jsonb (Must match `PricingRules` schema)
- **Seed Script:** Create a SQL script to populate this table with the current values from `business.ts` to ensure parity on Day 1.

### 2.3 Engine Update (`lib/pricing.ts`)

Refactor `calcQuote` to accept an optional `pricingOverride` parameter.

TypeScript

#

`export function calcQuote(
  input: CalculatorState,
  pricingOverride?: PricingRules // If null, use static PRICE_TABLE
): QuoteBreakdown {
   // Logic:
   // 1. Determine Base Price (from Override or Static)
   // 2. Calculate Additives Total = Sum(AdditivePrice * BilledM3)
   // 3. Calculate Slump Surcharge
   // 4. Final = (Base + Additives + Slump) * VAT
}`

### 2.4 UI Updates (Expert Mode)

- **File:** `components/Calculator/steps/forms/AdditivesForm.tsx`
- **Logic:**
    - Only render if `store.viewMode === 'expert'`.
    - Use `SelectionCard` (Checkbox variant) for multi-select.
    - Update Store actions to handle `toggleAdditive(id)`.

## 3. Exit Criteria

1. User can toggle "Expert Mode".
2. Selecting "Fibra" increases the total correctly.
3. **Regression Test:** A standard quote (no additives) returns the exact same price as the old engine.
4. **Fallback Test:** The calculator works even if `public.pricing_config` is empty or unreachable.
