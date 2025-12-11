# Playbook 03: Marketing Ops & Data Sync

**Status:** 🏃 ACTIVE (Sprint 3)
**Goal:** Establish robust server-side tracking (Meta CAPI), enhance SEO visibility, and enable dynamic pricing operations.

## 1. Tracking & Analytics (✅ Implemented)

Infrastructure deployed in v0.3. Focus shifts to validation.

### 1.1 Meta CAPI & Deduplication

- **Status:** Code complete (`lib/tracking/capi.ts`).
- **Pending Validation:**
  - Verify `event_id` match rate in Meta Events Manager (>80% expected).
  - **Action:** Monitor logs for "CAPI Success" vs "Pixel Fire".

### 1.2 SEO Schemas

- **Status:** Code complete (`lib/seo.ts`).
- **Pending Validation:**
  - **Rich Snippets:** Run the final deployment URL through [Google Rich Results Test](https://search.google.com/test/rich-results).
  - Verify `OfferCatalog` correctly lists concrete types.

## 2. Data Infrastructure (🚧 Pending Implementation)

**Context:** According to `docs/DB_SCHEMA.md`, Phase 3 must migrate pricing from static files to the database to allow marketing teams to adjust prices without code deployments.

### 2.1 Pricing Sync Strategy

- **Source of Truth:** Migrate from `config/business.ts` to `public.price_config` table (Supabase).
- **Fetching Strategy:** Use **Incremental Static Regeneration (ISR)** or `unstable_cache` (Next.js) with a revalidation time of 60-300 seconds.
  - *Rationale:* Pricing doesn't change every second; avoid hitting DB quota on every page view.
- **Fail-Open Requirement:** If Supabase is down or returns empty, the system **MUST** fall back silently to `DEFAULT_PRICING_RULES` (static file).

### 2.2 Implementation Tasks

- [ ] **DB Service:** Create `lib/data/pricing.ts` to fetch rules.
- [ ] **Hook Update:** Modify `usePricingRules` (or the server component prop) to prefer DB data over local config.
- [ ] **Seed Script:** Ensure `scripts/seed-pricing.ts` is robust and populates the DB with the current production values.

## 3. Quality Assurance & Testing (Critical)

**Current Coverage Gap:** We have math tests, but lack integration tests for the new CAPI and async pricing logic.
**Target:** 100% Pass Rate on the following scenarios.

### 3.1 Automated Tests Plan

Run `pnpm test` and ensure the following new suites are covered:

1. **CAPI Privacy & Hashing (`lib/tracking/capi.test.ts`):**
    - [ ] **Case:** Input email ` " User@Example.COM " ` → Output SHA256 matches `user@example.com`.
    - [ ] **Case:** Missing data fields do not crash the `submitLead` action.

2. **Pricing Resilience (`lib/data/pricing.test.ts`):**
    - [ ] **Case (Happy Path):** Returns DB pricing when available.
    - [ ] **Case (DB Failure):** Returns `DEFAULT_PRICING_RULES` when fetch throws error.
    - [ ] **Case (Empty DB):** Returns `DEFAULT_PRICING_RULES` when result is null.

3. **SEO Generation:**
    - [ ] **Case:** `generateLocalBusinessSchema` produces valid JSON-LD structure.

## 4. Exit Criteria

The phase is NOT complete until:

1. [ ] **Dynamic Pricing:** Changing a price in the `price_config` table updates the frontend calculator (after revalidation window).
2. [ ] **Fail-Open Proven:** Disconnecting the DB allows the calculator to function with static prices.
3. [ ] **Tracking Verified:** Meta Events Manager shows "Deduplicated" events.
4. [ ] **Test Suite:** 100% Pass rate on all Unit and Integration tests (including new Tracking/Pricing tests).
