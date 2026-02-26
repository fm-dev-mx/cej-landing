# Execution Guide: CEJ Platform

**Status:** Living Document
**Version:** 2.4 (Phase 4A Completed, Phase 4B Planned)

---

## 1. Vision & Core Philosophy

**Product:** From **CEJ Landing (Lead Gen)** → **CEJ Cotizador (Expert Calculator)** → **CEJ Pro (SaaS Portal)**
**Goal:** Transform a high-performance landing page into a robust SaaS platform for concrete contractors in Ciudad Juárez.

### 1.1 The "Fail-Open" Philosophy

We prioritize the user's ability to complete a quote and contact sales above all else.

- **Principle:** Technical failures (database down, API timeout, tracking failure) must *never block* the primary conversion path (WhatsApp redirect).
- **Implementation:** All critical mutations (lead submission) have graceful degradation paths implemented via optional env vars and defensive `try/catch` blocks.
- **Outcome:** Users can always reach CEJ via WhatsApp with a valid quote summary, even during partial outages.

---

## 2. Technical Stack & Standards

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5.9 (strict mode)
  - No `any` in core paths: pricing, store, persistence, tracking.
- **Styling:** SCSS Modules only
  - Constraint: No Tailwind. Use `styles/_tokens.scss` + `styles/_mixins.scss`.
- **State Management:** Zustand (`store/useCejStore`)
- **Validation:** Zod for all user/input-facing payloads.
- **Database:** Supabase (Postgres + Auth + RLS)
- **Tracking:** Meta Pixel + Meta CAPI (server-side), optional analytics.

### 2.1 Code Conventions

- **UI text:** Spanish only.
- **File naming:** `PascalCase` for components, `camelCase` for hooks/utils.
- **Tests:**
  - `*.test.ts` for Vitest.
  - Playwright specs under `tests/e2e`.

### 2.2 Environments

- **Local:** `.env.local`, developer workstation.
- **Preview:** Vercel preview deployments (feature branches).
- **Production:** Vercel production environment.

Environment-specific secrets are configured via Vercel and never committed.

---

## 3. Environments & Configuration

### 3.1 Mandatory Environment Variables

See `README.md` for the full table. Key requirements:

- Supabase URLs and keys (anon + service role).
- Meta Pixel and Meta CAPI credentials.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` for handoff.

### 3.2 Configuration Files

- `config/pricing.local.ts` – Local fallback pricing rules.
- `lib/pricing.ts` – Engine that consumes either `price_config` (DB) or fallback.
- `lib/tracking/*` – Pixel + CAPI abstractions.

---

## 4. Execution Roadmap

This table is the authoritative view of project phases and their status. Each phase is backed by one or more docs under `/docs`.

| Phase | Playbook/Ref | Goal | Status |
| --- | --- | --- | --- |
| **0. Hardening** | `docs/archive/PLAYBOOK_00_QA_HARDENING.md` | Math accuracy & A11y baseline. | ✅ Completed |
| **1. Data Core** | `docs/archive/PLAYBOOK_01_DATA_CORE.md` | DB persistence & fail-open infra. | ✅ Completed |
| **2. Engine** | `docs/archive/PLAYBOOK_02_CALC_ENGINE.md` | Expert features (additives, dynamic pricing). | ✅ Completed |
| **3. Marketing** | `docs/archive/PLAYBOOK_03_MARKETING_OPS.md` | Server-side tracking (CAPI) & SEO. | ✅ Completed |
| **4A. Local Pro** | *See ROADMAP.md Sprint 4* | Local quote history, UX refinements, persistent cart. | ✅ Completed |
| **4B. Cloud SaaS** | `docs/PLAYBOOK_04_SAAS_PORTAL.md` | Auth, profiles, cloud sync, A11y automation. | 📅 Planned |
| **4C. CEJ Pro Ops** | {TODO: future playbook} | Billing, contractor accounts, admin tools. | {TODO} |

> Phase 4B is defined in PLAYBOOK_04. Phase 4C requires business input before being decomposed into concrete sprints.

---

## 5. Quality Gates

### 5.1 Testing

**Unit / Integration (Vitest):**

- `lib/pricing.ts`
- `store/useCejStore`
- `lib/utils` (formatting, parsing, WhatsApp URL building)
- `hooks/useCheckoutUI`, `hooks/useQuoteCalculator`

**E2E (Playwright):**

- Anonymous flow: Landing → Calculator → WhatsApp handoff.
- Cart & QuoteDrawer behavior.
- Edge cases: validation errors, mobile viewport, iOS-like conditions.

### 5.2 Accessibility

- **Current:**
  - Semantic HTML, ARIA attributes, focus styles.
  - High contrast support via `prefers-contrast: more`.
- **Backlog (A11y-02):**
  - `prefers-reduced-motion` global support.
  - axe-core integration with Playwright for `/`, calculator, and lead modal.

See `docs/ACCESSIBILITY.md` for patterns and checklists.

### 5.3 Performance

- Lighthouse targets:
  - Performance: ≥ 90 on mobile.
  - Accessibility: ≥ 95.
  - Best Practices: ≥ 95.
  - SEO: ≥ 95.
- Large assets are avoided; images are optimized via Next.js `Image`.

---

## 6. Release Process

### 6.1 Branching & CI

- All work happens on feature branches.
- CI pipeline:
  1. `pnpm lint`
  2. `pnpm test`
  3. `pnpm test:e2e` (subset or full, depending on pipeline configuration)

A merge to `main` must not break any of the above.

### 6.2 Versioning & Changelog

- Semantic Versioning (MAJOR.MINOR.PATCH).
- `CHANGELOG.md` records:
  - Features added,
  - Changes,
  - Fixes,
  - Unreleased / planned items (e.g. Phase 4A).

---

## 7. Operational Runbook

### 7.1 Incident Response (DB / Tracking Failures)

- If Supabase is down:
  - Lead submission logs the failure.
  - User still sees the WhatsApp handoff.
- If Meta CAPI fails:
  - Errors are reported via `lib/monitoring.ts`.
  - Pixel continues to function in the browser.

### 7.2 Deploying a New Release

1. Ensure `CHANGELOG.md` is updated.
2. Tag the release (e.g. `v0.3.0`).
3. Merge into `main`.
4. Vercel auto-deploys; verify:
   - Health check on `/`.
   - Calculator flow on mobile.
   - One full lead flow to WhatsApp.

---

## 8. Phase 4A – Local Pro (Completed)

### 8.1 Delivered Features

Phase 4A delivered:

- **Quote History:** Local persistence via `useCejStore.history`.
- **Re-order Flow:** `loadQuote()` to restore historical quotes.
- **UX Refinements:** Progressive disclosure, hybrid validation, form compactness.
- **Persistent Cart:** Cart survives page refreshes and route changes.

The Cloud SaaS features (Auth, Profiles, cloud sync) belong to Phase 4B.

### 8.2 Success Criteria

Phase 4A is considered **done** when:

1. A user can:
   - Sign in via email (Magic Link),
   - Be redirected to `/dashboard`.
2. A profile row exists for each authenticated user.
3. Orders are persisted and listed in `/dashboard`.
4. “Reordenar” clones a previous order into the current cart using **current** pricing.
5. axe-core checks are integrated into Playwright and CI.
6. All docs (README, ROADMAP, PLAYBOOK_04, DESIGN_SYSTEM, ACCESSIBILITY) are updated and consistent.

---

## 9. Phase 4B – Cloud SaaS (Planned)

Phase 4B scope:

- Auth (Magic Link) + `/login` and `/dashboard` pages.
- Profiles (`public.profiles`).
- Cloud order history sync.
- Pricing data sync to Supabase (`price_config`).
- A11y automation (axe-core).

See `docs/PLAYBOOK_04_SAAS_PORTAL.md` for full execution plan.

---

## 10. Future Work: Phase 4C – CEJ Pro Ops

Placeholder for future evolution:

- Contractor billing,
- Order lifecycle tracking,
- Admin panel.

> {TODO: business decision required – define exact scope and constraints for Phase 4C before implementation.}
