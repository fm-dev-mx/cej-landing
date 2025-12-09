# Technical Architecture

## 1. Technology Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5.9
- **Styling:** SCSS Modules (`_tokens.scss`, `_primitives.scss`)
- **State:** Zustand v5 (with `persist` middleware)
- **Backend:** Supabase (Postgres + Auth), accessed via Server Actions
- **Analytics:** GA4 + Meta Pixel (browser) + CAPI (server)

---

## 2. Folder Structure Standards

To ensure maintainability during the SaaS scaling phases:

1. **Folder-per-Component**
   Complex components (such as `Header`) must live in their own directory containing both `.tsx` and `.module.scss`.

   - ✅ `components/layouts/header/Header.tsx`
   - ❌ `components/layouts/Header.tsx` (flat file)

2. **No Typos**
   Directory names must be consistent and intentional (`ToolShell`, not `ToolSheel`).

3. **Barrel Files**
   Use `index.ts` sparingly and mostly for library-style exports, e.g. `lib/schemas/index.ts`.

4. **Colocation**
   Tests (`.test.ts` / `.spec.ts`) should live next to the file they test.

---

## 3. Core Patterns

### 3.1 Fail-Open Persistence

Lead submission uses:

- **DB path:** Insert into `leads` table.
- **CAPI path:** Fire Meta CAPI with hashed PII and `event_id`.

If Supabase is not configured or write fails:

- Errors are logged with `reportError` / `reportWarning`.
- The action still returns `success: true` so the WhatsApp handoff is never blocked.

### 3.2 Global UI Orchestrator

`components/layouts/GlobalUI.tsx` is mounted once at the root (`app/layout.tsx`) and contains:

- `FeedbackToast`
- `QuoteDrawer`
- `SmartBottomBar`

This prevents losing cart state when navigating between:

- Marketing routes (`app/(marketing)/*`)
- Internal tool routes (`app/(app)/*`, future CEJ Pro)

### 3.3 Domain Separation

- `lib/schemas/calculator.ts`
  Input validation for physical and geometric constraints (dimensions, area, thickness, m³).

- `lib/schemas/orders.ts`
  Validation for business payloads (leads, quotes, financials, tracking, privacy).

- `lib/pricing.ts`
  Pricing engine: minimum order constraints, rounding to 0.5 m³, additives and freight pricing.

- `app/actions/submitLead.ts`
  Server action to persist leads and send CAPI events.

---

## 4. Data Flow (Quote → Lead → WhatsApp)

1. **Calculator Form** (`components/Calculator/CalculatorForm.tsx`)

   - Captures inputs (mode, volume, strength, type, additives).
   - Uses `useQuoteCalculator` to compute a `Quote` object and warnings.

2. **Cart & History** (`store/useCejStore.ts`)

   - Adds the current quote as a cart item.
   - Maintains history of previous quotes.

3. **Checkout Modal** (`LeadFormModal` + `useCheckoutUI`)

   - Captures name and phone.
   - Calls `useCheckoutUI.processOrder`.

4. **Server Action** (`submitLead`)

   - Validates payload with `OrderSubmissionSchema`.
   - Stores `quote_data` snapshot in `leads`.
   - Optionally calls Meta CAPI with hashed PII.

5. **WhatsApp Handoff**

   - Builds a prefilled message including folio, items and total.
   - Opens `wa.me` link for the configured `NEXT_PUBLIC_WHATSAPP_NUMBER`.

---

## 5. Future Extensions

- **Phase 3 – Auth & Profiles**
  - Link `leads` and `orders` to authenticated `profiles`.
  - Enable CEJ Pro dashboards over the same data model.

- **Phase 4 – Price Config Admin**
  - CRUD UI over `price_config`.
  - Support for seasonal pricing and zone-based freight rules.
````
