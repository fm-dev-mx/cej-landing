# Step 03 — Optional Form UX: WhatsApp-First Dual CTA

**Estimated effort:** ~3–4h
**Risk:** Medium-High — changes the most visible user-facing conversion flow
**Depends on:** Step 00 (tracking setup), Step 01 (optional, no hard dependency)
**Blocks:** Step 04 (which adds tracking to the new CTA buttons added here)

---

## Implementation Progress

> **Last audited:** 2026-02-27 by Sync Audit (v2)
> **Completion:** 75% (5/8 items — 2 partial)

| # | Item | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Add `QuoteCTA` component for WhatsApp-first path | ✅ | `components/Calculator/QuoteCTA.tsx` |
| 2 | Support dual CTA behavior (`onOpenForm` secondary path) in `QuoteCTA` | 🔶 | `components/Calculator/QuoteCTA.tsx` has WhatsApp direct only; secondary form CTA/onOpenForm not present |
| 3 | Reuse existing quote/WhatsApp message utilities for direct CTA | 🔶 | `components/Calculator/QuoteCTA.tsx` uses `buildDirectQuoteMessage`; planned folio-aware `buildQuoteMessage` behavior is incomplete |
| 4 | Integrate `QuoteCTA` into calculator result area | ✅ | `components/Calculator/QuoteSummary.tsx` |
| 5 | Add close/cancel action to checkout modal | ✅ | `components/Calculator/modals/SchedulingModal.tsx` |
| 6 | Open WhatsApp after `processOrder` using returned folio | ✅ | `components/Calculator/modals/SchedulingModal.tsx` |
| 7 | Add privacy note with privacy-policy link in modal | ✅ | `components/Calculator/modals/SchedulingModal.tsx` |
| 8 | Add unit tests for `QuoteCTA` and quote-message utility | ⬜ | Not found |

## Pre-conditions

- [ ] Steps 00 and 01 are committed
- [ ] `pnpm test --run` passes

---

## Context & Hypothesis

**Current flow:**
```
Calculator result → "Solicitar Cotización" → Required form (name + phone) → submitLead → WhatsApp
```

**Problem:** Every user who does not want to share data hits a dead end. The form acts as a mandatory gate, causing drop-off before any conversion intent is captured.

**Proposed flow — two paths, one decision point:**
```
Calculator result →
  Path A: "Consultar por WhatsApp" (PRIMARY) → Pre-filled WhatsApp message (no data required)
  Path B: "Quiero que me contacten" (SECONDARY) → Opens existing form → processOrder → WhatsApp
```

---

## Pre-execution Audit Findings (GAP-06, GAP-07)

> **GAP-06 — No new folio generator needed.** `generateQuoteId()` already exists in `lib/utils.ts` (format: `WEB-YYYYMMDD-XXXX`, already tested and used by `useCheckoutUI`). The plan previously proposed `lib/logic/folio.ts` as a new file — this is **cancelled**. Use the existing utility.

> **GAP-07 — `QuoteCTA` must integrate with `useCheckoutUI`, not bypass it.** Path B (the optional form) must call `useCheckoutUI.processOrder()` — which is responsible for: generating the `fbEventId` for CAPI deduplication, persisting the contact to Zustand via `updateUserContact`, and calling `dispatchOrder`. The calling component (LeadFormModal or equivalent) is already responsible for building the WhatsApp URL after `processOrder` resolves. `QuoteCTA` does **not** manage this state.

---

## Component Architecture

### New component: `components/Calculator/QuoteCTA/`

> Replaces or wraps the current checkout trigger button in the quote result area.

**Files:**
- `QuoteCTA.tsx`
- `QuoteCTA.module.scss`
- `QuoteCTA.test.tsx`

**Props interface:**
```ts
type QuoteCTAProps = {
  quote: QuoteBreakdown;
  onOpenForm: () => void; // Opens LeadFormModal (Path B) — passed from parent
};
```

**Internal behavior:**

```ts
// Path A — WhatsApp direct (no form, no server call)
const handleWhatsAppDirect = () => {
  const folio = generateQuoteId(); // From lib/utils — existing utility
  const message = buildQuoteMessage(quote, folio);
  const url = getWhatsAppUrl(env.NEXT_PUBLIC_WHATSAPP_NUMBER, message);
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
  // Step 04 adds: trackContact('whatsapp') here
};

// Path B — Open the existing form (handled by parent via useCheckoutUI)
const handleOpenForm = () => {
  // Step 04 adds: trackInitiateCheckout({ value: quote.total }) here
  onOpenForm();
};
```

### WhatsApp message builder (co-located or in `lib/utils.ts`)

Evaluate whether to add `buildQuoteMessage(quote: QuoteBreakdown, folio: string): string` to the existing `lib/utils.ts` alongside `generateCartMessage`. If the signature is compatible with the existing utility pattern, prefer extending it over creating a new helper.

Template (Spanish, wa.me-ready):
```
Hola, me interesa una cotización:

📦 *{concreteType label} f'c {strength}*
📐 Volumen: {billedM3} m³
💰 Precio estimado: ${fmtMXN(total)} (IVA incluido)
📋 Folio: {folio}

¿Podrían confirmarme disponibilidad y condiciones de entrega?
```

### Existing `LeadFormModal` (or equivalent checkout modal) — MODIFY

Locate the component that renders the checkout form (it calls `useCheckoutUI` internally). Modify it to:

1. Add a clearly visible close/cancel button so users who open the form can return to see the dual CTA.
2. After `processOrder` resolves with `{ success: true, folio }`, build the WhatsApp URL and open it. This responsibility **already belongs to this component** — verify it does so and ensure the folio from `processOrder` is used (not a separately generated one).
3. Add a privacy note below the form fields: `"Tu información solo se usa para contactarte. No la compartimos con terceros."` with a link to `/aviso-de-privacidad`.

### Integration point in the parent (calculator result area)

The parent component that currently renders the checkout CTA must be updated to:
1. Render `<QuoteCTA quote={quote} onOpenForm={openModal} />` instead of the current single-button trigger.
2. Keep managing the modal open/close state (no state moves to `QuoteCTA`).

---

## Visual Hierarchy Spec

```
┌─────────────────────────────────────────────────────┐
│  Tu cotización: $11,600 MXN · 5.0 m³ · f'c 200     │
│                                                     │
│  [  📱 Consultar por WhatsApp  ]  ← PRIMARY (full)  │
│                                                     │
│  ¿Prefieres que te contactemos?                     │
│  [  Enviar mis datos  ]  ← SECONDARY (outline)      │
└─────────────────────────────────────────────────────┘
```

- **Primary:** `background-color: #25D366` (WhatsApp green — add as token `--color-whatsapp`), white text, full-width, `min-height: 48px`.
- **Secondary:** `border: 2px solid var(--color-brand)`, transparent background.
- **Mobile:** stacked vertically, primary first.
- **Desktop:** primary full-width, secondary below it.

---

## Tests to Write

### `components/Calculator/QuoteCTA/QuoteCTA.test.tsx`

- [ ] `it('renders the WhatsApp primary CTA button')`
- [ ] `it('renders the secondary form CTA button')`
- [ ] `it('builds a WhatsApp URL using generateQuoteId and getWhatsAppUrl on primary click')`
  - Mock `getWhatsAppUrl` from `lib/utils`. Assert called with correct message substring.
- [ ] `it('calls onOpenForm when secondary CTA is clicked')`
- [ ] `it('does not call onOpenForm when primary CTA is clicked')`

### `lib/utils.test.ts` (UPDATE if buildQuoteMessage is added there)

- [ ] `it('buildQuoteMessage includes volume, strength, concreteType, and folio')`

---

## Commit Strategy

```
# Commit A — dual CTA component
feat(calculator): add WhatsApp-first dual CTA to quote result

- Add QuoteCTA component (Path A: WhatsApp direct, Path B: form)
- Use existing generateQuoteId from lib/utils for folio generation
- Add buildQuoteMessage to lib/utils for pre-filled WhatsApp text
- Add --color-whatsapp token to styles/_tokens.scss
- Add QuoteCTA unit tests

# Commit B — optional form UX
feat(calculator): make lead capture form optional with close button

- Add close/cancel button to LeadFormModal (or equivalent)
- Add privacy note with aviso link below form fields
- Verify WhatsApp redirect after processOrder uses the returned folio
```

---

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test --run
```

**Manual check:**
1. Calculator → configure quote → see `QuoteCTA` with two buttons.
2. Click `"Consultar por WhatsApp"` → WhatsApp opens with pre-filled message. No form shown.
3. Click `"Quiero que me contacten"` → form modal opens with close button visible.
4. Close the form → both CTAs still visible.
5. Fill and submit form → Supabase row inserted, WhatsApp opens (same as before).
