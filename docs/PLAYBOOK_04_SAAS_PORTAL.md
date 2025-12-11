# Playbook 04: SaaS Portal (Phase 4A – Auth & History)

**Status:** Planned (Phase 4A / Sprint 4)
**Goal:** Transition from anonymous guest checkout to authenticated user accounts with synced order history, while preparing the ground for CEJ Pro.

---

## 1. Scope & Objectives

We are introducing the first iteration of the "Client Portal" capabilities.

### 1.1 In Scope (Phase 4A – SaaS Portal MVP)

- **Authentication:** Allow users to Sign Up / Login via Email (Magic Link). OTP is explicitly out of scope for this phase.
- **Identity / Profiles:** Create a permanent `Profile` record linked to the Auth User.
- **Order History:** Enable users to view their past Quotes and Orders inside a `/dashboard` area.
- **Pricing Data Sync:** Migrate the calculator to use Supabase `price_config` as the primary pricing source, keeping `FALLBACK_PRICING_RULES` as a fail-open fallback.
- **Accessibility & Quality:** Integrate automated accessibility checks (axe-core + Playwright) into the existing E2E suite.

### 1.2 Out of Scope (Phase 4B / Future)

- Advanced CEJ Pro functionality (fulfillment, delivery tracking, invoicing, contractor billing).
- Multi-tenant / multi-user org-level management.
- Admin UI for editing price matrices in the browser.

{TODO: business decision required – finalize the exact Phase 4B scope.}

---

## 2. Data Architecture

### 2.1 New Tables (Provisioned in `schema.sql`)

1. **`auth.users` (Supabase Internal):** Handles credentials and sessions.
2. **`public.profiles`:**
   - `id`: References `auth.users(id)`.
   - `full_name`, `email`, `phone`, `rfc`, `address`.
   - *Security:* RLS enabled (Users can only read/edit their own profile).
3. **`public.orders`:**
   - Evolution of the `leads` table for registered users.
   - Linked to `profiles.id`.

### 2.2 The "Trigger" Pattern

We must ensure every registered user has a corresponding row in `public.profiles`.

- **Mechanism:** Postgres Trigger `on_auth_user_created`.
- **Action:** Automatically inserts into `public.profiles` using data from `raw_user_meta_data`.

### 2.3 Pricing Configuration

- **Primary Source:** `price_config` table in Supabase (used by the `PricingAdapter` as documented in `ARCHITECTURE.md`).
- **Fallback:** `FALLBACK_PRICING_RULES` local config, used only when the DB is unreachable or empty.
- **Goal:** After Phase 4A, all production traffic should read prices from `price_config` under normal conditions.

---

## 3. Execution Steps

### Step 0: Pricing Data Sync (`price_config`)

- [ ] Confirm `price_config` schema and seed data using `scripts/seed-pricing.ts`.
- [ ] Wire `lib/pricing.ts` to use `price_config` as the primary source and `FALLBACK_PRICING_RULES` as fallback only.
- [ ] Add feature flag or health check behavior if needed to keep the calculator fail-open.

### Step 1: Authentication Infrastructure

- [ ] Install Supabase SSR helpers: `@supabase/ssr`.
- [ ] Create Auth Hooks: `useUser`, `useSession`.
- [ ] Create Middleware: Protect routes under `/app/(app)/dashboard`.

### Step 2: Auth UI Components

- [ ] **Login Screen:** Simple form requesting Email.
- [ ] **Magic Link Handler:** Verify token logic and handle success/error states.
- [ ] **User Menu:** Update Header to show "Hola, [Name]" when logged in and provide a logout action.

### Step 3: Order History

- [ ] **Sync Logic:** When a user logs in, check if they have local `cart` items or previous `leads` (via cookie matching) and associate them (Optional for MVP).
- [ ] **Dashboard Page:** List rows from `public.orders` for the current profile.
- [ ] **Detail View:** Re-use `TicketDisplay` to show order details, including totals and breakdown.

### Step 4: Re-order Feature

- [ ] Add a "Re-order" action in the order details view to clone a previous order into the current cart.
- [ ] Ensure cloned orders respect the current pricing rules (pull fresh prices from `price_config` instead of copying stale amounts).
- [ ] Move cloned quotes into the existing cart → QuoteDrawer flow.

### Step 5: Quality & Infrastructure (A11y Automation)

**Goal:** Integrate `axe-core` into Playwright to enforce WCAG 2.1 AA compliance automatically.

**Implementation Specs:**

1. **Dependency:** Install `@axe-core/playwright`.
2. **New Test:** Create `tests/accessibility.spec.ts`.
3. **Scope:** The test must scan:
   - Home Page (`/`)
   - Calculator Widget (Initial state)
   - Lead Form Modal (Open state)
4. **Config:** Fail on `critical` and `serious` violations.

**Acceptance Criteria:**

- [ ] `pnpm test:e2e` runs the accessibility suite.
- [ ] CI pipeline fails if a violation is detected.
- [ ] Report provides clear actionable feedback on A11y errors.

### Step 6: Documentation & DX

- [ ] Update `docs/DESIGN_SYSTEM.md` with any new portal-specific components and states.
- [ ] Update `docs/INTERACTION_PATTERNS.md` and `docs/UX_FLOWS.md` for Auth + Dashboard flows.
- [ ] Align `docs/ACCESSIBILITY.md` Reduced Motion backlog section with the implemented patterns.
- [ ] Ensure `README.md` and `docs/ROADMAP.md` reference this playbook as Phase 4A.

---

## 4. Exit Criteria

1. User can Sign Up via Magic Link.
2. User is redirected to `/dashboard` upon login.
3. `public.profiles` is populated automatically for each authenticated user.
4. User can logout from the header menu.
5. User can see a list of previous orders and their details in `/dashboard`.
6. User can trigger "Re-order" from an existing order and land back in the existing cart/checkout flow.
7. `price_config` is the primary pricing source in production, with `FALLBACK_PRICING_RULES` used only as a fail-open fallback.
8. **Quality Gate:** All Auth and Dashboard integration tests pass 100%.
9. **Accessibility:** Key views (Home, Calculator, Dashboard, Lead Form) pass automated WCAG 2.1 AA checks (axe-core).
