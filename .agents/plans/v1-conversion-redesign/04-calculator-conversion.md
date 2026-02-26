# Step 04 — Calculator Conversion: Analytics Events & UX Hardening

**Estimated effort:** ~2h
**Risk:** Low — purely additive changes, no existing behavior modified
**Depends on:** Step 00 (tracking infrastructure), Step 03 (new CTA components with hook points)
**Blocks:** Nothing (this is the final step)

---

## Pre-conditions

- [ ] Steps 00, 01, 02, 03 are committed
- [ ] `pnpm test --run` passes

---

## Context

The `visitor.ts` module contains `trackViewContent()` which is currently dead code — it is exported but never called from any component. The audit also identified that:

1. **`InitiateCheckout`** is a missing mid-funnel event fired when a user opens the optional form (Path B from Step 03).
2. **`ViewContent`** should fire when the user first sees the quote result.
3. **SPA `PageView`** — `fbq('track', 'PageView')` only fires once on initial load. Subsequent client-side navigations in Next.js App Router do not re-trigger it.
4. **Quote result persistence** — if the user navigates back, the quote result should still be visible (may already be handled by Zustand `persist`, but must be verified).

---

## Changes

### `lib/tracking/visitor.ts` (ADD)

Add the `trackInitiateCheckout` function:

```ts
type CheckoutData = {
  value: number;
  currency?: string;
};

/**
 * InitiateCheckout — fires when user opens the optional lead capture form.
 * No eventID needed (intent signal, not a conversion — no CAPI counterpart required).
 */
export const trackInitiateCheckout = ({
  value,
  currency = 'MXN',
}: CheckoutData): void => {
  if (!hasFbq()) return;
  window.fbq?.('track', 'InitiateCheckout', { value, currency });
};
```

### Call sites (based on Step 03 output)

- **`trackViewContent()`** → call inside the result display component (`QuoteSummary.tsx` or equivalent) using `useEffect` with a **stable derived key** — not an empty `[]` array. An empty deps array would skip re-firing if the user recalculates without unmounting the component (common in SPA flows):
  ```ts
  // Derive a stable key that changes only when the quote configuration changes
  const quoteKey = `${quote.volume.billedM3}-${quote.strength}-${quote.concreteType}`;

  useEffect(() => {
    trackViewContent(quote.total, 'MXN', `Concreto ${quote.concreteType} f'c ${quote.strength}`);
  }, [quoteKey]); // fires once per unique quote configuration, not on every render
  ```
  > ⚠️ Do **not** use `// eslint-disable-line react-hooks/exhaustive-deps` as a workaround. Use the derived key instead.

- **`trackInitiateCheckout()`** → call in `QuoteCTA.tsx` (Step 03) when the secondary CTA (Path B) is clicked — inside the `onOpenForm` handler wrapper:
  ```ts
  const handleOpenForm = () => {
    trackInitiateCheckout({ value: quote.total });
    onOpenForm();
  };
  ```

### `components/PageViewTracker/PageViewTracker.tsx` (NEW)

SPA-aware PageView component that fires on every route change:

```tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/tracking/visitor';

/**
 * PageViewTracker
 * Mount once in the root layout. Fires fbq('track', 'PageView')
 * on every client-side navigation in addition to the initial load.
 * The initial PageView fired by the inline script in layout.tsx still handles
 * the first load — this component handles subsequent SPA navigations.
 */
export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackPageView();
  }, [pathname]);

  return null;
}
```

**Integration:** Add `<PageViewTracker />` to `app/layout.tsx` inside the body, after the existing Pixel `<Script>` block. It must be a Client Component rendered inside the `<AuthProvider>`.

> **Deduplication note:** The first `PageView` is already fired by the inline `fbq('track', 'PageView')` in `layout.tsx`. `PageViewTracker` fires on every `pathname` change — including the initial render. This means the first PageView will be fired **twice** for the initial load (once inline, once by the tracker's initial effect). To avoid this, either: (a) remove the inline `fbq('track', 'PageView')` from `layout.tsx` and let `PageViewTracker` handle all PageViews, OR (b) skip the first render in `PageViewTracker` using a `useRef` mount guard.
>
> **Recommended approach:** Remove `fbq('track', 'PageView')` from the inline script in `layout.tsx` and let `PageViewTracker` handle all PageViews uniformly. This is cleaner and avoids the double-fire.

### Quote Result Persistence (VERIFY)

Check `store/useCejStore.ts`:
- Confirm `cart` (which holds quote results) uses Zustand `persist` middleware with `localStorage`.
- Confirm the most recent quote result is accessible after navigation back to the calculator.
- If not persisted, add the quote result to the persisted slice. Do **not** increment `version` unless the shape changes (read `docs/ARCHITECTURE.md §6.2` migration policy first).

---

## Tests to Write

### `lib/tracking/visitor.test.ts` (UPDATE)

- [ ] `it('tracks InitiateCheckout with value and currency')`
  - Assert `mockFbq` called with `('track', 'InitiateCheckout', { value: 5000, currency: 'MXN' })`
- [ ] `it('tracks ViewContent with dynamic content_name')`
  - Full path test for `trackViewContent(11600, 'MXN', "Concreto Directo f'c 200")`
- [ ] `it('tracks Lead without event_id (alternative path)')`
  - Call `trackLead({ value: 5000, currency: 'MXN', content_name: 'Test' })` without `event_id`
  - Assert `mockFbq` called with 3 args (no options object)

### `components/PageViewTracker/PageViewTracker.test.tsx` (NEW)

- [ ] `it('calls trackPageView on initial render')`
- [ ] `it('calls trackPageView again when pathname changes')`
- [ ] `it('renders null (no DOM output)')`

---

## Commit Strategy

```
# Commit A — new tracking events
feat(tracking): add trackInitiateCheckout and activate trackViewContent

- Export trackInitiateCheckout from visitor.ts
- Call trackViewContent on QuoteSummary mount
- Call trackInitiateCheckout when user opens optional lead form
- Add missing unit tests for new events and uncovered paths

# Commit B — SPA PageView tracker
feat(tracking): add PageViewTracker component for SPA route awareness

- Add PageViewTracker client component using usePathname
- Remove duplicate fbq PageView call from layout.tsx inline script
- Mount PageViewTracker in root layout
- Add unit tests for PageViewTracker
```

---

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test --run
```

**Manual check (using Meta Events Manager with TEST_EVENT_CODE set):**
1. Load `/` → `PageView` event appears in Events Manager.
2. Navigate to `/cotizador` → `PageView` appears again.
3. Configure and view a quote result → `ViewContent` appears with correct value.
4. Click secondary CTA `"Quiero que me contacten"` → `InitiateCheckout` appears.
5. Fill and submit form → `Lead` appears (browser) + `Lead` appears (CAPI, deduplicated).

---

## Final State: Event Coverage After All Steps

| Event | Browser Pixel | CAPI | Deduplication |
|---|---|---|---|
| `PageView` | ✅ Every route | ❌ Not needed | N/A |
| `ViewContent` | ✅ On result view | ❌ Intent only | N/A |
| `Contact` | ✅ On CTA clicks | ❌ Intent only | N/A |
| `InitiateCheckout` | ✅ On form open | ❌ Intent only | N/A |
| `Lead` | ✅ On form submit | ✅ Server + `after()` | ✅ Shared UUID |

**Projected EMQ: 7.5–8 / 10** (with `external_id`, `fn`, `ph`, `em`, `fbp`, `fbc`)
