# Roadmap: CEJ Platform

This roadmap describes how **CEJ Landing → CEJ Cotizador → CEJ Pro (SaaS)** evolve over time through aligned sprints.

---

## 1. Strategic Phases

1. **CEJ Landing (Completed)** – Traffic capture and friction-free conversion to WhatsApp.
2. **CEJ Cotizador (Completed)** – Robust calculator with cart, expert mode, and local persistence.
3. **CEJ Pro (Planned)** – SaaS platform for contractors (order history, re-orders, billing and operations).

Each strategic phase maps to one or more sprints and playbooks under `/docs`.

---

## 2. Sprint Plan

### ✅ Sprint 1: QA Hardening & Infrastructure (Completed)

**Goal:** Eliminate technical debt and ensure mathematical integrity.

- [x] **Math Integrity:** Exhaustive tests for rounding, MOQs, and float precision.
- [x] **Fail-Open Architecture:** Resilient `submitLead` implementation.
- [x] **UX Consolidation:** GlobalUI for persistent cart visibility.

**Outcome:**
The calculator can be trusted mathematically, and failures in persistence/infra no longer block the main UX (WhatsApp handoff).

---

### ✅ Sprint 2: Data Core & Expert Engine (Completed)

**Goal:** Real data persistence and advanced logic.

- [x] **DB Infrastructure:** Supabase provisioning (`leads` table) and RLS policies.
- [x] **Strict Typing:** Database types definition and Zod schemas.
- [x] **Dynamic Engine:** Refactored `pricing.ts` to support dependency injection.
- [x] **Expert UI:** Additives selection form and toggle logic.
- [x] **State Migration:** Zustand store versioning and auto-migration for legacy clients.

**Outcome:**
Pricing and persistence moved from ad-hoc configs to a well-typed, migratable, and extendable engine.

---

### ✅ Sprint 3: Marketing Ops (Completed)

**Goal:** Solve iOS data loss and improve Semantic SEO.

- [x] **Meta CAPI:** Server-side event tracking implemented in `submitLead`.
- [x] **Event Deduplication:** Shared `event_id` architecture connecting Client and Server events.
- [x] **SEO Schemas:** Product and OfferCatalog JSON-LD implementation.
- [x] **Rich Snippets:** Final validation of JSON-LD schemas.

**Outcome:**
Tracking is more robust across platforms (including iOS), and the site is better positioned for rich results and analytics.

---

### 🏃 Sprint 4: SaaS Portal (Phase 4A – In Progress)

**Goal:** User identification, recurring orders, and quality assurance.

#### 4.1 UX Refinements (In Progress)

- [x] **Progressive Disclosure:** QuoteSummary with compact → breakdown → submitted states
- [x] **Validation Fixes:** Spanish error messages for all Zod schemas
- [x] **Number Formatting:** Consistent `.toFixed(2)` for volume display
- [x] **Documentation:** VALIDATION.md, COPY_GUIDELINES.md, updated UX_FLOWS.md
- [ ] **Validation Timing:** Implement hybrid on-blur validation (prevent premature errors)
- [ ] **Form Compactness:** CSS refinements for "Ayúdame a calcular" flow
- [ ] **Error Focus:** Auto-focus first invalid field on form submit

#### 4.2 History & Orders (Planned)

- [x] **Quote History:** Local history via `useCejStore.history`
- [x] **Reutilizar:** `loadQuote()` to restore historical quotes
- [ ] **Quote States:** Visual differentiation (Cotización vs Contactado vs Confirmado)
- [ ] **Contact Channels:** Phone call CTA alongside WhatsApp {PLANNED}
- [ ] **SLA Display:** Time-based contact expectation messages {PLANNED}

#### 4.3 SaaS Infrastructure (Planned)

- [ ] **Data Sync:** Migrate from static `FALLBACK_PRICING_RULES` to live `price_config` table in Supabase.
- [ ] **Auth:** Supabase Auth integration (Magic Link).
- [ ] **Profiles:** User profile management (`public.profiles`).
- [ ] **Order Sync:** Sync local cart to database for authenticated users.
- [ ] **Re-order:** Clone previous order with current pricing.
- [ ] **A11y Testing:** Automated axe-core integration via Playwright.

**Outcome (expected):**
The system gains an authenticated dashboard where recurring customers can view and re-order, and QA is reinforced with automated A11y checks.

---

## 3. Future Phases & Themes

These are **directional**, not yet fully specified. They require business validation before being promoted to concrete sprints.

### 3.1 Phase 4B – CEJ Pro Ops (Planned)

**Tentative Scope (subject to business decisions):**

- Contractor-level accounts with multiple users.
- Basic invoicing and billing records.
- Order lifecycle tracking (requested → scheduled → delivered).
- Admin tooling to manage pricing and configuration from a UI.

> {TODO: business decision required – confirm exact scope and naming for Phase 4B.}

---

### 3.2 Cross-Cutting Backlog Themes

These themes may span multiple sprints:

- **Accessibility Hardening (A11y-02+):**
  - Implement global `prefers-reduced-motion` support.
  - Complete automated axe-core coverage for all critical flows.
- **Design System Completion:**
  - Ensure all production components are documented in `COMPONENT_LIBRARY.md`.
  - Finalize motion, spacing, and iconography guidelines.
- **Observability & Monitoring:**
  - Centralize error reporting.
  - Add basic business KPIs (quotes created, leads closed, re-orders).

---

## 4. How to Use This Roadmap

- **Product & Business:** Use the phases and sprints to decide priorities and constraints for upcoming releases.
- **Engineering:** Use the sprint checklists and playbooks to organize implementation and QA tasks.
- **Design & Marketing:** Use the backlog themes (A11y, Design System, Observability) to propose additional work items that align with the platform’s evolution.
