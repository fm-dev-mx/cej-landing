# Playbook 04: Cloud SaaS Infrastructure (Phase 4B)

**Status:** Planned (Sprint 5)
**Goal:** Transition from "Local Pro" (Phase 4A) to "Cloud Pro" by introducing Authentication and Data Sync.

---

## 1. Context & Objectives

**Phase 4A (Completed)** delivered a "Local SaaS" experience:

- Quote History (localStorage).
- Persistent Cart.
- Re-order capability (from local history).

**Phase 4B (This Playbook)** upgrades this to a "Cloud SaaS" experience:

- **Authentication:** Users can log in to access their data on any device.
- **Sync:** Local history is uploaded to the cloud (`public.orders`).
- **Profiles:** Permanent user identity (`public.profiles`).

---

## 2. Scope

| Feature | Scope | Description |
| :--- | :--- | :--- |
| **Auth** | **In Scope** | Magic Link (Email) via Supabase Auth. |
| **History Sync** | **In Scope** | Upload `localStorage` quotes to `public.orders` on login. |
| **Live Pricing** | **In Scope** | Switch `lib/pricing.ts` to consume `price_config` (DB). |
| **Billing** | Out of Scope | Invoicing remains offline/manual for now. |
| **Multi-User** | Out of Scope | One user = One contractor profile. |

---

## 3. Data Architecture

### 3.1 Schemas (Provisioned)

- **`auth.users`:** Identity provider.
- **`public.profiles`:** Linked 1:1 to `auth.users`. Contains `rfc`, `address`, `phone`.
- **`public.orders`:** The persistent record of quotes.
  - Linked to `profiles.id`.
  - JSONB `snapshot`: Full quote data at time of creation.

### 3.2 Pricing Strategy (Hybrid)

- **Current:** `FALLBACK_PRICING_RULES` (Local FS).
- **Target:** `price_config` (DB).
- **Migration:**
  1. Seed DB with current rules.
  2. Update `PricingAdapter` to prefer DB, fall back to Local.

---

## 4. Execution Plan

### Step 1: Pricing Data Migration

- [ ] Run `npx tsx scripts/seed-pricing.ts` to populate Supabase.
- [ ] Verify `lib/pricing.ts` reads from DB when `SUPABASE_Url` is configured.

### Step 2: Authentication (UI)

- [x] Create `/login` page (Magic Link form).
- [x] Add `UserProfileMenu` to Header (Avatar + Logout).
- [x] Middleware: Protect `/dashboard`.

### Step 3: Local-to-Cloud Sync

- [ ] **On Login:** Trigger a "Merge" operation.
- [ ] Read `useCejStore.history` (Local).
- [ ] POST to `api/sync-history` (Server Action).
- [ ] Clear Local History after successful sync.
- [ ] Hydrate Store from `public.orders`.

### Step 4: Dashboard & Re-orders

- [x] Create `/dashboard/page.tsx`.
- [x] Fetch orders via Server Actions (RLS protected).
- [ ] **Re-order Action:**
  - Load `order.snapshot` into `useCejStore.draft`.
  - Redirect to `/calculator` with `mode=edit`.
  - Ensure pricing is **re-calculated** with current rates (do not respect old prices).

### Step 5: Accessibility Automation

- [ ] Integrate `@axe-core/playwright`.
- [ ] Add CI check for accessibility violations on critical paths.

## Related Documents

- [`UX_STANDARDS.md`](./UX_STANDARDS.md) — UX, validation, and interaction standards
- [`COPY_GUIDELINES.md`](./COPY_GUIDELINES.md) — Message catalog

---

## 5. Success Criteria

1. **Seamless Upgrade:** A user with local history logs in -> History appears in Dashboard.
2. **Cross-Device:** User logs in on Mobile, sees quotes created on Desktop.
3. **Fail-Safe:** If DB is down, Auth pages show maintenance, but Calculator (Public) still works.
