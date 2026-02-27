# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2026-02-27] — Plan Implementation Audit

### Documentation
- Added implementation progress trackers to all plan documents in `v1-quick-wins/` and `v1-architecture-blueprint/`.
- Created per-folder `CHANGELOG.md` files for plan tracking.
- Overall implementation status: **52%** across 11 plan documents.

## [0.4] - 2025-12-15 (Phase 4A: Local Pro)

**Focus:** Local SaaS capabilities, UX Hardening, and Documentation Alignment.

This release marks the completion of the "Local Pro" phase, where the calculator gains memory (History/Drafts) without requiring a login, and aligns the documentation with the production state.

### Added

- **Local History:** Quotes are now persisted in `localStorage` and visible in the QuoteDrawer history tab.
- **Re-order Flow:** One-click restoration of past quotes into the active calculator state.
- **Documentation Audit:**
  - Standardized `ROADMAP.md` to reflect the split between Phase 4A (Local) and Phase 4B (Cloud).
  - Consolidated `EXECUTION_GUIDE.md` and `README.md`.
  - Created `PLAYBOOK_04_SAAS_PORTAL.md` focused on the upcoming Cloud/Auth phase.

### Changed

- **Component Structure:**
  - Refactored `components/layouts/Footer` to its own directory to comply with architectural standards.
- **UX Refinements:**
  - Improved error messages (Spanish) and validation timing (on-blur).
  - Better mobile spacing and "Ayúdame a calcular" progressive disclosure.

---

## [Unreleased] - Phase 4B: Cloud SaaS (Planned)

**Focus:** User identification, authentication, sync, and centralized profiles.

The Phase 4B workstream prepares the transition to a fully authenticated SaaS.

### Planned – Authentication & Identity

- **Supabase Auth (Magic Link):** Email-based passwordless sign-in using `@supabase/ssr` helpers, compatible with Next.js App Router.
- **Session Management:** Reusable hooks (`useUser`, `useSession`) to read the authenticated user and session in both client and server components.
- **Protected Routes:** Middleware to restrict access to `/app/(app)/dashboard` and other SaaS-only routes.
- **Profiles Table:** `public.profiles` table linked 1:1 with `auth.users(id)` via a Postgres trigger, ensuring that every authenticated user has a profile row.
- **Automatic Profile Provisioning:** `on_auth_user_created` trigger to populate profile fields (`full_name`, `email`, `phone`, `rfc`, `address`) from `raw_user_meta_data`.

### Planned – Orders, History & Data Sync

- **Orders Table:** `public.orders` as the evolution of `public.leads` for authenticated users, referencing `profiles.id` and storing normalized quote/order data.
- **Order History Dashboard:** `/dashboard` view listing previous orders with pagination and filters.
- **Quote Detail View:** Reuse of `TicketDisplay` to render a complete "ticket" view for a single historical order.
- **Cart & Leads Association (Optional MVP):** On login, link existing `cart` items and prior `leads` (via identity cookies) to the authenticated profile.
- **Dynamic Pricing Source of Truth:** Migration from `FALLBACK_PRICING_RULES` (local file) to a live `price_config` table in Supabase, with a seeding script and graceful fail-open fallback when the DB is unavailable.

### Planned – Client Portal UX

- **Login Screen:** Minimal email-only login screen (UI en español) that triggers Magic Link flow.
- **OTP/Magic Link Handler:** Handling of verification tokens and redirect to `/dashboard` on success.
- **Header User Menu:** Update the main header to show `"Hola, [Nombre]"` when logged in, plus a sign-out option.
- **Re-order Flow:** One-click "Reordenar" action that clones a previous order into the current cart and opens the calculator/checkout.

### Planned – Quality, Accessibility & Tooling

- **Automated Accessibility Testing (axe-core):** Integrate `@axe-core/playwright` into the Playwright suite to enforce WCAG 2.1 AA on:
  - Home (`/`)
  - Calculator widget (initial state)
  - Lead Form Modal (open state)
- **CI Gate:** Make `pnpm test:e2e` fail on `critical` and `serious` axe-core violations in CI.
- **State Migration Extensions:** Prepare the Zustand `useCejStore` migration pipeline for new auth/order fields while preserving existing cart data.

### Active – Documentation

- **SaaS Portal Playbook:** Keep `docs/PLAYBOOK_04_SAAS_PORTAL.md` as the operational guide for Phase 4 (Auth & History).
- **Tracking & Pricing Docs:** Update `PRICING_MODEL.md`, `TRACKING_GUIDE.md`, and `DB_SCHEMA.md` to cover `public.orders`, `price_config`, and hybrid tracking for authenticated users.
- **Design System & Interaction Patterns:** Complete motion, reduced-motion, and SaaS-specific UI patterns as requested in the roadmap backlog.

---

## [0.3] - 2025-12-10 (Phase 3: Marketing Ops)

**Focus:** Server-side tracking reliability and SEO enrichment.

This release consolidates **hybrid tracking** (Pixel + CAPI), identity cookies, and semantic SEO so that every successful lead can be attributed consistently without degrading the user experience.

### Added

- **Meta CAPI Integration:**
  - Introduced `sendToMetaCAPI` in `lib/tracking/capi.ts` to send server-side events mirroring browser Pixel events.
- **Event Deduplication:**
  - Unified `event_id` generation inside `useCheckoutUI` and propagated it to both Pixel and CAPI, enabling Meta’s deduplication mechanism.
- **Identity Tracking (Cookies):**
  - Added `lib/tracking/identity.ts` to manage first-party cookies:
    - `cej_vid` (Visitor ID, 1-year persistence)
    - `cej_sid` (Session ID, 30-minute window)
- **SEO Schemas:**
  - Extended `lib/seo.ts` to output `Product` and `OfferCatalog` JSON-LD for primary CEJ offerings, improving rich results potential.

### Changed

- **Lead Submission Pipeline:**
  - Refactored `submitLead` server action to trigger CAPI events asynchronously via `next/server/after`, keeping the **Fail-Open** UX intact (WhatsApp redirect is never blocked by tracking failures).
- **Privacy & Compliance:**
  - Updated `/aviso-de-privacidad` to document the use of server-side tracking and hashed PII sharing with Meta, aligning legal text with the new tracking architecture.

---

## [0.2] - 2025-12-08 (Phase 2: Expert Engine)

**Focus:** Dynamic pricing architecture, additives support, and advanced UI/UX for power users.

This release turns the calculator into a more configurable **Expert Engine**, capable of handling additives and future price sources without code changes.

### Added

- **Expert Mode UI:**
  - Toggleable **Expert Mode** (`ExpertToggle`) that exposes additive options (e.g., fiber, accelerant) while keeping the default flow simple for non-experts.
- **Dynamic Pricing Core:**
  - Refactored `calcQuote` in `lib/pricing.ts` to accept injected `PricingRules`, decoupling computation logic from static configuration and enabling multiple data sources (local config vs database).
- **Additives Logic:**
  - Support for:
    - **Volumetric** additives (`per_m3`)
    - **Fixed-per-load** additives (`fixed_per_load`)
  - Ensures additives are correctly reflected in the quote breakdown.
- **Pricing Data Contract:**
  - Introduced `lib/schemas/pricing.ts` (Zod) to validate local and remote pricing data, enforcing strict contracts around strengths, services, and surcharge rules.
- **Detailed Cost Breakdown:**
  - Updated the summary/ticket UI to display:
    - Base concrete
    - Additives
    - VAT
    - Total
  - Instead of showing a single aggregated number.
- **Desktop UX Enhancements:**
  - Added a `"Mis pedidos"` button to the header on large screens for faster access to existing quotes/cart state.

### Changed

- **State Management (Zustand):**
  - Upgraded `useCejStore` to **version 2**, introducing a migration function to safely add new fields (`additives`, `showExpertOptions`) for existing users without breaking persisted state.
- **Data Persistence:**
  - Extended the checkout payload so that the `additives` array is persisted inside `quote_data` (JSONB) in the `leads` table, keeping DB snapshots aligned with the UI.
- **Resilience Defaults:**
  - Introduced `DEFAULT_PRICING_RULES` as a local fallback to keep the calculator functional if external pricing fetching fails.

### Fixed

- **Visual Regression in Labels:**
  - Corrected inconsistent terminology between `"Total Estimado"` and `"Total Neto"` in integration tests and UI, aligning with the current copy guidelines (UI en español).
- **Hydration Stability:**
  - Addressed crashes caused by legacy localStorage states missing newly added fields by hardening null-checks and leveraging the store migration pipeline.

---

## [0.1] - 2025-12-07 (Phase 1: Data Core)

**Focus:** Infrastructure hardening, fail-open persistence, and production-ready data paths.

This was the first tagged phase where the landing + calculator behaved like a robust data product, not just a static lead form.

### Added

- **Fail-Open Lead Submission:**
  - Implemented a resilient `submitLead` Server Action that:
    - Validates payloads with strict schemas.
    - Logs DB failures via centralized monitoring.
    - Still returns `success: true` and triggers WhatsApp handoff even if Supabase is temporarily unavailable.
- **Database Schema – Leads:**
  - Provisioned the `public.leads` table with:
    - `quote_data` as a JSONB snapshot of the cart at submission time.
    - RLS policies for secure read/write patterns.
- **Centralized Monitoring Utility:**
  - Added `lib/monitoring.ts` with `reportError(error, context)` for non-blocking error reporting across server and client paths.
- **Type Safety for Critical Paths:**
  - Introduced strict Zod schemas for:
    - Order submission payloads.
    - Environment variables (Supabase keys, Pixel ID, site URL).
- **Math Integrity Tests:**
  - Added comprehensive unit tests for rounding behavior, MOQs, and float normalization in `pricing.ts`.
- **Global UI Orchestrator:**
  - Mounted `components/layouts/GlobalUI.tsx` at the app root to keep cart, quote drawer, and toasts persistent across route transitions.

---

> **Note:** Earlier *pre-0.1* work (initial landing, basic calculator, and initial design system scaffolding) is documented in the archived playbooks (`docs/archive/PLAYBOOK_00_*` to `PLAYBOOK_02_*`) and in the corresponding Git history, but not tracked as tagged semantic versions here.
