# Product Roadmap & Sprints

## 1. Strategic Phases

1.  **CEJ Landing (Completed):** Traffic capture and friction-free conversion to WhatsApp.
2.  **CEJ Cotizador (Current):** Robust tool with multi-item cart, expert mode, and local persistence.
3.  **CEJ Pro (Next):** SaaS platform for contractors (Order management and billing).

## 2. Sprint Plan

### ✅ Sprint 1: QA Hardening & Infrastructure (Completed)
*Goal: Eliminate technical debt and ensure mathematical integrity.*
- [x] **Math Integrity:** Exhaustive tests for rounding, MOQs, and float precision.
- [x] **Fail-Open Architecture:** Resilient `submitLead` implementation.
- [x] **UX Consolidation:** GlobalUI for persistent cart visibility.

### ✅ Sprint 2: Data Core & Expert Engine (Completed)
*Goal: Real data persistence and advanced logic.*
- [x] **DB Infrastructure:** Supabase provisioning (`leads` table) and RLS policies.
- [x] **Strict Typing:** Database types definition and Zod schemas.
- [x] **Dynamic Engine:** Refactored `pricing.ts` to support Dependency Injection.
- [x] **Expert UI:** Additives selection form and toggle logic.
- [x] **State Migration:** Zustand store versioning and auto-migration for legacy clients.

### 🏃 Sprint 3: Marketing Ops (Active)
*Goal: Solve iOS data loss and improve Semantic SEO.*
- [ ] **Meta CAPI:** Server-side event tracking implementation (`submitLead` integration).
- [ ] **Event Deduplication:** Shared `event_id` architecture (Pixel + Server).
- [ ] **Rich Snippets:** JSON-LD expansion with `OfferCatalog` for concrete types.

### 📅 Sprint 4: SaaS Foundation (Planned)
*Goal: User identification and recurring orders.*
- [ ] **Auth:** Supabase Auth integration (Magic Link).
- [ ] **Profiles:** User profile management (`public.profiles`).
- [ ] **Order History:** Sync local cart to database for authenticated users.
