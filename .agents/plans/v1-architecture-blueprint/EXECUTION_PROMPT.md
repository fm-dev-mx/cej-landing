# Execution Prompt — V1 Conversion Redesign

> **Usage:** Copy the content below the `---` line and paste it as a new chat prompt.
> Each phase is designed to be executed in a **separate conversation** to avoid
> context exhaustion. Start with Phase 0, then proceed sequentially.

---

## Phase 0 — Foundation: Middleware, Route Groups & Security Headers

**Role**: Senior Next.js Architect specializing in App Router security boundaries and edge middleware.

**Context**:
You are executing Phase 0 of the `cej-landing` v1 conversion redesign. The full blueprint lives in `.agents/plans/v1-architecture-blueprint/`. Before writing any code, read **all six files** in that directory to build complete context. This phase focuses exclusively on the foundational architectural changes that every subsequent phase depends on.

**Mandatory Pre-Reading** (read these files in order before any action):
1. `.agents/plans/v1-architecture-blueprint/structure.md` — Architecture & Boundaries
2. `.agents/plans/v1-architecture-blueprint/01-architectural-audit.md` — Risk & Debt Analysis
3. `.agents/plans/v1-architecture-blueprint/05-compliance-checklist.md` — Verification criteria

**Scope — ONLY these tasks (no more, no less):**

1. **Create `middleware.ts`** at the project root.
   - Implement route protection for `/dashboard/*` using Supabase SSR auth cookie verification.
   - Implement `_fbc` cookie injection when `fbclid` is present in query params (see `02-conversion-capi-strategy.md` §3.2).
   - Set security headers on all responses: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (see `01-architectural-audit.md` A6).
   - Use the edge-compatible matcher pattern from `structure.md` §3.2.

2. **Rename route groups**: `(marketing)` → `(public)`, `(app)` → `(admin)`.
   - Update all internal imports affected by the rename.
   - Delete the orphan `cotizador` route (see audit A9) — verify zero traffic first by checking if it has any internal links.

3. **Add security headers** to `next.config.ts` via the `headers()` function (see audit A6).

4. **Remove `placehold.co`** from `next.config.ts` `remotePatterns` (see audit A10). Search for any `<Image>` references using that domain and replace them with actual assets or remove them.

**Strict Constraints:**
- Do NOT touch the Zustand store, tracking modules, or `AuthProvider` scope in this phase.
- Do NOT rename any component files or restructure the `components/` directory.
- Every route that currently works MUST still work after your changes (no regressions).
- Follow all project conventions: read `/project-conventions` workflow before committing.

**Verification (mandatory before declaring done):**
- `pnpm typecheck` passes with zero errors.
- `pnpm lint` passes with zero errors.
- `pnpm test` passes (all existing unit tests green).
- Manually verify: unauthenticated access to `/dashboard` in an incognito browser redirects to `/login`.
- Manually verify: `/` loads correctly without auth-related network requests.
- Verify checklist items R1–R8 and S1–S6 from `05-compliance-checklist.md`.

---

## Phase 1 — Bundle Isolation: Store Split & Layout Decoupling

**Role**: Senior React/Next.js Performance Engineer specializing in bundle optimization and client/server boundary management.

**Context**:
You are executing Phase 1 of the `cej-landing` v1 conversion redesign. Phase 0 (middleware, route groups, security headers) is already complete. The full blueprint lives in `.agents/plans/v1-architecture-blueprint/`. Read all six files before proceeding.

**Mandatory Pre-Reading:**
1. `.agents/plans/v1-architecture-blueprint/structure.md` §2 — State Management Boundaries
2. `.agents/plans/v1-architecture-blueprint/01-architectural-audit.md` — Findings A2, A3, A7, A8
3. `.agents/plans/v1-architecture-blueprint/05-compliance-checklist.md` §1.2 — Bundle Isolation

**Scope — ONLY these tasks:**

1. **Split the Zustand store** into `store/public/usePublicStore.ts` and `store/admin/useAdminStore.ts`.
   - `usePublicStore` keeps: `calculatorSlice`, `cartSlice`, `uiSlice`, `userSlice`, `submissionSlice`.
   - `useAdminStore` gets: `ordersSlice`.
   - Maintain the existing `localStorage` key `cej-pro-storage` for the public store (migration-safe).
   - Use a new key `cej-admin-storage` for the admin store.
   - Write a state migration in the public store that drops the `orders` key from the persisted state.
   - Update ALL imports across the codebase (`useCejStore` → `usePublicStore` or `useAdminStore`).
   - Update the existing store test file to match the new split.

2. **Move `AuthProvider`** from `app/layout.tsx` to `app/(admin)/layout.tsx`.
   - Public routes must never import or render `AuthProvider`.

3. **Move `GlobalUI`** (FeedbackToast, QuoteDrawer, SmartBottomBar) from `app/layout.tsx` to `app/(public)/layout.tsx`.
   - Dashboard routes should NOT render these overlay components.

4. **Move `PageViewTracker`** from `app/layout.tsx` to `app/(public)/layout.tsx`.

5. **Move Meta Pixel `<Script>`** from `app/layout.tsx` to `app/(public)/layout.tsx`.
   - GA `<Script>` stays in root `app/layout.tsx` (global analytics).

6. **Clean up `app/layout.tsx`** — after moving all public-specific components, the root layout should only contain: `<html>`, `<body>`, Google Analytics scripts, `<SpeedInsights>`, `<Analytics>`, and `{children}`.

**Strict Constraints:**
- Do NOT change any CAPI, tracking, or UTM logic in this phase.
- Do NOT modify any component internals — only change imports and mounting locations.
- The store split must be transparent to all existing component consumers (same API surface).
- Run `pnpm build` and verify no Supabase-related chunks appear in `(public)` route output.

**Verification:**
- `pnpm typecheck` passes.
- `pnpm lint` passes.
- `pnpm test` passes (update affected tests).
- `pnpm build` succeeds — inspect build output to confirm `(public)` route pages do not import Supabase or `ordersSlice`.
- Verify checklist items B1–B4 from `05-compliance-checklist.md`.

---

## Phase 2 — Tracking: CAPI Retry, Contact Endpoint & UTM Consolidation

**Role**: Conversion Tracking Engineer specializing in Meta CAPI integration, event deduplication, and attribution modeling.

**Context**:
You are executing Phase 2 of the `cej-landing` v1 conversion redesign. Phases 0–1 are complete (middleware exists, store is split, layouts are decoupled). Read all six blueprint files, paying special attention to `02-conversion-capi-strategy.md`.

**Mandatory Pre-Reading:**
1. `.agents/plans/v1-architecture-blueprint/02-conversion-capi-strategy.md` — Complete document
2. `.agents/plans/v1-architecture-blueprint/01-architectural-audit.md` — Findings A4, A5, A11
3. `.agents/plans/v1-architecture-blueprint/05-compliance-checklist.md` §2 — CAPI & Tracking Validation

**Scope — ONLY these tasks:**

1. **Enhance `lib/tracking/capi.ts`** with retry-with-backoff logic.
   - 3 retries with exponential backoff (1s, 2s, 4s) for 5xx/network errors.
   - Immediate fail on 4xx (bad payload — do not retry).
   - 5-second timeout per request using `AbortSignal.timeout()`.
   - If all retries fail, call a `insertDeadLetter()` function to persist the failed event.
   - Implement `insertDeadLetter()` to write to a `capi_dead_letters` Supabase table (create the SQL schema in `docs/schema.sql`).
   - Write comprehensive unit tests for the retry logic, covering: success on first try, success on retry, permanent failure after max retries, 4xx no-retry behavior.

2. **Create `app/api/track-contact/route.ts`** — server-side CAPI endpoint for WhatsApp Contact events.
   - Accepts `POST` with `{ event_id, method, visitor_id, page_url }`.
   - Reads `_fbp`, `_fbc` from cookies and `client_ip_address`, `user_agent` from headers.
   - Calls `sendToMetaCAPI()` with event_name `Contact`.
   - Add rate limiting: max 10 requests per IP per minute (in-memory counter or middleware-based).
   - Write unit tests for the route handler.

3. **Add phone normalization** to `submitLead.ts`:
   - Create a `normalizePhone()` function that strips non-digits and prepends Mexican country code `52` if needed.
   - Apply before `hashData()` for the `ph` CAPI parameter.
   - Write unit tests for normalization edge cases.

4. **Consolidate UTM tracking** into a single cookie-based system:
   - Create `lib/tracking/attribution.ts` with a cookie-first approach (`cej_utm`, 30-day expiry).
   - Capture UTM params in `middleware.ts` on first visit (server-side cookie set).
   - Deprecate `hooks/useAttribution.ts` and `lib/tracking/utm.ts` — remove all usages and replace with the new unified module.
   - Update `submitLead.ts` and `dispatchOrder` to read UTM from the new system.
   - Write unit tests for the new attribution module.

5. **Update `trackContact()`** in `lib/tracking/visitor.ts` to accept an `event_id` parameter for Pixel deduplication.

**Strict Constraints:**
- Do NOT change any UI components, store logic, or dashboard features in this phase.
- All CAPI payloads must conform to Meta's Graph API v19.0 specifications.
- Every new function must have corresponding unit tests.
- The dead-letter SQL schema must be added to `docs/schema.sql`, not executed directly.

**Verification:**
- `pnpm typecheck` passes.
- `pnpm lint` passes.
- `pnpm test` passes (all new and existing tests green).
- Verify checklist items T1–T8, D1–D4, Q1–Q4, U1–U5 from `05-compliance-checklist.md`.
- Use `META_TEST_EVENT_CODE` to send test events and verify deduplication in Meta Events Manager (manual check — document the test event IDs).

---

## Phase 3 — UX Optimization: Form Validation, Pre-Nav Tracking & Mobile Polish

**Role**: Senior UX Engineer specializing in conversion rate optimization, mobile-first form design, and accessibility compliance.

**Context**:
You are executing Phase 3 of the `cej-landing` v1 conversion redesign. Phases 0–2 are complete (middleware, store split, CAPI retry, UTM consolidation). Read all six blueprint files, paying special attention to `03-ux-friction-reduction.md`.

**Mandatory Pre-Reading:**
1. `.agents/plans/v1-architecture-blueprint/03-ux-friction-reduction.md` — Complete document
2. `.agents/plans/v1-architecture-blueprint/05-compliance-checklist.md` §3 (Core Web Vitals), §5 (Accessibility)

**Scope — ONLY these tasks:**

1. **Implement the Fire-Before-Navigate pattern** for all WhatsApp CTA clicks.
   - Use the `handleTrackedOutboundClick` pattern from `03-ux-friction-reduction.md` §3.2.
   - Fire both browser Pixel (with `eventID`) and server CAPI (`/api/track-contact`) before navigation.
   - Use `keepalive: true` on the fetch and a 150ms delay before `window.open()`.
   - Apply to ALL WhatsApp links: `CTAButtons`, `SmartBottomBar`, `SharedQuoteActions`, and any other CTA component.

2. **Enhance checkout form validation**:
   - Implement `onBlur` validation pattern (errors appear after leaving a field, not while typing).
   - Phone input: numeric-only, auto-formatted with spaces (`### ### ####`), digit counter.
   - Phone input: use `inputMode="tel"` on mobile.
   - Name input: use `inputMode="text"` with `autocomplete="name"`.
   - Set `font-size: 16px` minimum on all inputs (prevents iOS auto-zoom).
   - Add `aria-invalid` and `aria-describedby` for accessibility.
   - Add `role="alert"` on error messages.

3. **Implement error recovery UX** for submission failures:
   - Show offline folio + WhatsApp fallback CTA + retry button (see `03-ux-friction-reduction.md` §5.1).

4. **Optimize CTA touch targets** for mobile:
   - Min 56px height on mobile (< 768px).
   - Full-width CTAs below 768px.
   - Ensure all interactive elements meet the 44×44px minimum (WCAG AAA).

5. **Apply `interactiveWidget: 'resizes-content'`** to the `(public)/layout.tsx` viewport config.

**Strict Constraints:**
- Do NOT change any backend logic, server actions, or tracking modules.
- All styling must use SCSS Modules and the existing design token system (`_tokens.scss`, `_primitives.scss`).
- No new CSS frameworks or utility libraries.
- Follow the existing `_forms.scss` patterns for input styling.
- Test all changes on Chrome mobile emulator (iPhone SE, iPhone 14 Pro, Pixel 7).

**Verification:**
- `pnpm typecheck` passes.
- `pnpm lint` passes.
- `pnpm test` passes.
- Run Lighthouse on `/` (mobile): Performance ≥ 90, Accessibility ≥ 95.
- Verify checklist items L1–L5, C1–C4, X1–X6 from `05-compliance-checklist.md`.
- Visual QA: capture screenshots of the checkout form in error, valid, and processing states.

---

## Phase 4 — Dashboard Hardening: RBAC, Pagination & Admin Store

**Role**: Full-Stack Engineer specializing in internal tools, RBAC systems, and data-heavy UI performance.

**Context**:
You are executing Phase 4 of the `cej-landing` v1 conversion redesign. Phases 0–3 are complete. This phase focuses exclusively on the admin dashboard. Read `04-dashboard-roadmap.md` thoroughly.

**Mandatory Pre-Reading:**
1. `.agents/plans/v1-architecture-blueprint/04-dashboard-roadmap.md` — Complete document
2. `.agents/plans/v1-architecture-blueprint/structure.md` §3.3 — Defense in Depth
3. `.agents/plans/v1-architecture-blueprint/05-compliance-checklist.md` §4.3, §4.4

**Scope — ONLY these tasks:**

1. **Implement RBAC** in server actions:
   - Create `lib/auth/rbac.ts` with role definitions: `owner`, `admin`, `operator`, `viewer`.
   - Define permission map (see `04-dashboard-roadmap.md` §2.3).
   - Add `hasPermission()` guard to `createAdminOrder.ts` and `getMyOrders.ts`.
   - Store role in Supabase `user_metadata` (document the required manual setup step).
   - Write unit tests for `hasPermission()`.

2. **Add server-side cursor pagination** to `getMyOrders.ts`:
   - Accept `cursor` (ISO datetime string) and `pageSize` (default 25) parameters.
   - Return `{ orders, totalCount, nextCursor }`.
   - Update the `OrdersList` component to support "Load More" or Next/Prev navigation.

3. **Add `revalidate` caching** to the dashboard page:
   - Set `export const revalidate = 60` on the orders page.
   - Call `revalidateTag('orders')` in `createAdminOrder` after successful insert.

4. **Align dashboard layout** with the admin shell wireframe from `04-dashboard-roadmap.md` §4.1:
   - Add a minimal sidebar navigation (icons-only on mobile, expanded on desktop).
   - Add a top bar with user greeting and logout button.
   - Use CSS `content-visibility: auto` on the orders table for performance.

**Strict Constraints:**
- Do NOT modify any public-facing routes, components, or tracking.
- RBAC validation must be server-side only — never trust client-side role claims.
- Dashboard styling must not import from or conflict with the public design system.
- All new server action parameters must be validated with Zod.

**Verification:**
- `pnpm typecheck` passes.
- `pnpm lint` passes.
- `pnpm test` passes.
- Verify checklist items A1–A5, P1–P5 from `05-compliance-checklist.md`.
- Manually test: create an order, verify it appears in the paginated list, verify cache invalidation.

---

## Phase 5 — Final Compliance Sweep & Launch Readiness

**Role**: QA Lead and Release Manager performing the final pre-launch audit.

**Context**:
You are executing the final phase of the `cej-landing` v1 conversion redesign. All implementation phases (0–4) are complete. Your job is to verify every single item in `05-compliance-checklist.md` and produce a pass/fail report.

**Mandatory Pre-Reading:**
1. `.agents/plans/v1-architecture-blueprint/05-compliance-checklist.md` — Complete document (this IS your checklist)

**Scope:**

1. Execute **every verification command** listed in §6 of the compliance checklist.
2. Walk through **every checklist item** (R1–R8, B1–B4, T1–T8, D1–D4, Q1–Q4, U1–U5, L1–L5, C1–C4, S1–S6, F1–F6, A1–A5, P1–P5, X1–X6) and mark each as ✅ PASS or ❌ FAIL.
3. For any FAIL, document the exact issue and proposed fix.
4. Produce a summary report in `.agents/plans/v1-architecture-blueprint/LAUNCH_REPORT.md`.

**Output:**
A markdown file with every checklist item and its pass/fail status, plus a final GO / NO-GO recommendation.
