# 01 — Architectural Audit: Risk & Debt Analysis

> **Blueprint:** v1-architecture-blueprint
> **Last Updated:** 2026-02-27
> **Status:** Draft — Pending Review

---

## Implementation Progress

> **Last audited:** 2026-02-27 by Implementation Audit
> **Completion:** 38% (3/12 items — 3 partial)

| # | Item | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Create root `middleware.ts` edge guard for protected routes | 🔶 | `proxy.ts` provides similar logic, but required `middleware.ts` file is missing |
| 2 | Move `AuthProvider` out of root to admin-only layout | ⬜ | Not found (`app/layout.tsx` still mounts `AuthProvider`) |
| 3 | Move `GlobalUI` out of root to public-only layout | ⬜ | Not found (`app/layout.tsx` still mounts `GlobalUI`) |
| 4 | Implement CAPI retry/queue instead of fire-and-forget | ⬜ | Not found |
| 5 | Consolidate dual UTM systems into one authoritative source | ⬜ | Not found (`hooks/useAttribution.ts` + `lib/tracking/utm.ts` both active) |
| 6 | Add security headers in Next config | ✅ | `next.config.ts` |
| 7 | Split monolithic Zustand store for public/admin boundaries | 🔶 | `store/public/usePublicStore.ts` and `store/admin/useAdminStore.ts` exist, but `store/useCejStore.ts` monolith remains active |
| 8 | Remove Pixel loading from admin routes | ⬜ | Not found (`app/layout.tsx` initializes Pixel globally) |
| 9 | Remove orphan `/cotizador` route from admin/app group | ✅ | `app/(admin)` (no `cotizador` route present) |
| 10 | Remove placeholder image domain from production config | ✅ | `next.config.ts` |
| 11 | Align identity cookie key naming between docs and implementation | ⬜ | Not found (`lib/tracking/identity.ts` still uses `cej_visitor_id`; doc alignment pending) |
| 12 | Resolve unclear `proxy.ts` by folding into canonical middleware path | 🔶 | `proxy.ts` is present and functional, but canonical middleware migration is incomplete |

## 1. Critical Findings Summary

| # | Category | Severity | Finding |
|:--|:---------|:---------|:--------|
| A1 | Security | **P0** | No `middleware.ts` — zero edge-level route protection |
| A2 | Performance | **P0** | `AuthProvider` + Supabase client SDK loaded on all public routes |
| A3 | Performance | **P0** | `GlobalUI` (Zustand-dependent) ships in public + admin bundles |
| A4 | Tracking | **P1** | CAPI has no retry/queue — fire-and-forget loses events on transient failures |
| A5 | Tracking | **P1** | Dual UTM systems (`useAttribution.ts` cookie vs `utm.ts` localStorage) |
| A6 | Security | **P1** | No security headers in `next.config.ts` (X-Frame-Options, CSP, etc.) |
| A7 | Architecture | **P2** | Monolithic Zustand store leaks admin slices into public bundle |
| A8 | Performance | **P2** | FB Pixel `<Script>` loaded on admin routes (unnecessary tracking overhead) |
| A9 | Routing | **P2** | Orphan `cotizador` route inside `(app)` — dead code |
| A10 | Data | **P2** | `placehold.co` in image remote patterns — placeholder leak to production |
| A11 | Tracking | **P3** | `identity.ts` visitor cookie key (`cej_visitor_id`) differs from docs (`cej_vid`) |
| A12 | Architecture | **P3** | `proxy.ts` at project root — purpose unclear, not connected to middleware |

---

## 2. Detailed Analysis

### A1: Missing Middleware (P0 — Security)

**Current State:**
No `middleware.ts` file exists anywhere in the project. The only auth guard is
a server-side `getUser()` check in `(app)/dashboard/layout.tsx`.

**Impact:**
- Unauthenticated users can download the dashboard JavaScript bundle, exposing
  component structure, API endpoints, and admin-only UI logic.
- No session refresh at the edge — tokens may expire mid-session without
  triggering a re-auth.
- No centralized CORS/security header injection point.

**Mitigation:**
Create `middleware.ts` at the project root. See `structure.md` §3.2 for the
prescribed implementation. Middleware runs at the edge before any rendering,
preventing bundle delivery to unauthorized clients.

---

### A2: AuthProvider Global Scope (P0 — Performance)

**Current State:**
`AuthProvider` is mounted in `app/layout.tsx` (root layout), wrapping **all**
routes including the public landing page. This component:

1. Imports `@/lib/supabase/client` (Supabase browser SDK, ~15KB gzipped)
2. Calls `supabase.auth.getSession()` on every page load
3. Sets up an `onAuthStateChange` listener

**Impact on Landing Page:**
- **+15KB** to the public bundle (Supabase client SDK)
- **+1 network request** to Supabase on page load (session check)
- Degrades LCP by blocking the main thread during hydration

**Mitigation:**
Move `AuthProvider` to `(admin)/layout.tsx`. Public routes have no auth
requirements and should never load the Supabase client SDK.

---

### A3: GlobalUI Bundle Contamination (P0 — Performance)

**Current State:**
`GlobalUI.tsx` is a `'use client'` component mounted in `app/layout.tsx`. It
imports:

- `FeedbackToast` → depends on Zustand `useCejStore`
- `QuoteDrawer` → depends on Zustand `useCejStore`
- `SmartBottomBar` → depends on Zustand `useCejStore`

All three components are relevant only to the public quote flow, yet they render
on the `/dashboard` route as well (wasted bytes, unnecessary DOM nodes).

**Mitigation:**
Move `GlobalUI` mounting to `(public)/layout.tsx`. Dashboard uses its own
UI orchestration.

---

### A4: CAPI Fire-and-Forget (P1 — Tracking)

**Current State:**
`lib/tracking/capi.ts` → `sendToMetaCAPI()` performs a single `fetch()` to the
Meta Graph API. If the request fails (network error, 5xx, rate-limit), the
function logs via `reportError` and **discards the event permanently**.

```typescript
// Current: No retry, no queue, no dead-letter
catch (error) {
    reportError(error, { source: 'MetaCAPI', eventId: payload.event_id });
}
```

**Impact:**
- Transient Meta API failures (documented at 0.5-2% rate) result in permanent
  conversion data loss.
- Deduplication gaps: if the browser Pixel fires but the server CAPI fails,
  Meta may still count only the browser event (lower match quality score).

**Mitigation:**
Implement a retry-with-backoff strategy (see `02-conversion-capi-strategy.md`
§4). Minimum: 3 retries with exponential backoff (1s, 2s, 4s). If all retries
fail, log to a dead-letter table in Supabase for manual reconciliation.

---

### A5: Dual UTM Systems (P1 — Tracking)

**Current State:**
Two independent UTM capture systems exist and can produce conflicting data:

| System | File | Storage | Trigger |
|:-------|:-----|:--------|:--------|
| `useAttribution` hook | `hooks/useAttribution.ts` | Cookie (`cej_utm_data`, 30d) | `useEffect` on mount |
| `getOrInitUtmParams` | `lib/tracking/utm.ts` | `localStorage` (`cej_utm_params_v1`) | Called imperatively |

**Impact:**
- Different UTM values can be stored in Cookie vs localStorage if the user
  arrives via multiple campaigns across sessions.
- `submitLead.ts` uses `utm_source`/`utm_medium` from the payload (client-provided),
  not from a single authoritative source.
- Cookie-based UTM is more reliable for server-side access (available in CAPI),
  but `localStorage`-based UTM is what the hooks actually read.

**Mitigation:**
Consolidate into a single Cookie-based system. Cookies are accessible both
client-side and server-side (via `cookies()` in Server Actions), making them the
correct storage medium for attribution data that must flow to CAPI.

---

### A6: Missing Security Headers (P1 — Security)

**Current State:**
`next.config.ts` contains only `images.remotePatterns`. No security headers are
configured.

**Missing Headers:**

| Header | Value | Risk if Missing |
|:-------|:------|:----------------|
| `X-Frame-Options` | `DENY` | Clickjacking attacks |
| `X-Content-Type-Options` | `nosniff` | MIME-type sniffing attacks |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Leaking full URLs to third parties |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Unauthorized feature access |
| `Content-Security-Policy` | (See below) | XSS, script injection |

**CSP Note:** A strict CSP will require whitelisting:
- `https://connect.facebook.net` (FB Pixel)
- `https://www.googletagmanager.com` (GA)
- `https://www.google-analytics.com` (GA)
- `https://graph.facebook.com` (CAPI, server-only)

---

### A7: Monolithic Zustand Store (P2 — Architecture)

**Current State:**
`store/useCejStore.ts` combines 6 slices into one store with one `localStorage`
key. The `ordersSlice` is admin-only but is imported and persisted alongside
public slices.

**Impact:**
- Tree-shaking cannot eliminate `ordersSlice` from the public bundle because
  it is directly imported in the store composition.
- `localStorage` data grows unbounded (admin orders accumulate).

**Mitigation:**
Split into `usePublicStore` and `useAdminStore` (see `structure.md` §2.2).
Write a one-time migration for existing `cej-pro-storage` data.

---

### A8: Pixel on Admin Routes (P2 — Performance)

**Current State:**
The FB Pixel `<Script>` tag is in the root `app/layout.tsx`. It fires `PageView`
on every route, including `/dashboard`. This sends irrelevant tracking data to
Meta and adds ~25KB of script weight to admin pages.

**Mitigation:**
Move the FB Pixel to `(public)/layout.tsx`.

---

### A9: Orphan `/cotizador` Route (P2 — Routing)

**Current State:**
`app/(app)/cotizador/` exists but the calculator is embedded directly in the
landing page (`/`). This route may be a legacy holdover.

**Action:** Audit for incoming traffic. If zero, delete. If non-zero, redirect
to `/#calculator`.

---

### A10: Placeholder Image Domain (P2 — Data)

**Current State:**
`next.config.ts` includes `placehold.co` in `remotePatterns`. This suggests
placeholder images may still exist in the production codebase.

**Action:** Search for any `<Image src="https://placehold.co/...">` references.
Remove the domain from `remotePatterns` and replace any placeholder images with
actual assets or Cloudinary references.

---

### A11: Identity Cookie Key Mismatch (P3 — Tracking)

**Current State:**
- `lib/tracking/identity.ts` uses `cej_visitor_id` (cookie) and `cej_session_id`
  (sessionStorage).
- `docs/ARCHITECTURE.md` §6.1 references `cej_vid` and `cej_sid`.

**Impact:** Documentation drift. Not a functional bug, but a risk for future
developers who rely on docs for debugging.

**Action:** Align documentation with code (code is the source of truth).

---

### A12: Orphan `proxy.ts` (P3 — Architecture)

**Current State:**
`proxy.ts` and `proxy.test.ts` exist at the project root. The file name suggests
middleware-like behavior, but there is no `middleware.ts` that imports or
references it.

**Action:** Audit purpose. If this is a precursor to middleware, fold it into
the new `middleware.ts`. If it is unused, archive it.

---

## 3. Scalability Bottlenecks for Dashboard

| Area | Current Limitation | Future Risk |
|:-----|:-------------------|:------------|
| Data fetching | `getMyOrders()` fetches all orders per user, no pagination | UI stalls at 100+ orders |
| State | Orders in `localStorage` grow unbounded | Browser quota exceeded |
| Auth | No RBAC — any authenticated user sees all dashboard features | Cannot differentiate admin vs. read-only |
| Layout | Admin pages have no navigation shell (sidebar, breadcrumbs) | Poor UX for multi-section dashboard |
| Caching | No `revalidate` or cache-control on server components | Every page load hits Supabase |

---

## 4. Single-Point-of-Failure Analysis: Dual-Flow

### Web Form Submission Flow

```
User → Calculator → Checkout Form → submitLead() → Supabase + CAPI → WhatsApp
```

**SPOF Risks:**
1. **Supabase down:** Mitigated (fail-open returns `success: true`).
2. **CAPI down:** NOT mitigated (no retry → conversion data lost).
3. **WhatsApp redirect fails:** NOT mitigated (no fallback contact method).

### WhatsApp Direct Flow

```
User → CTA Button → wa.me link
```

**SPOF Risks:**
1. **No tracking fired:** The `Contact` event fires via `fbq('track', 'Contact')`,
   which is browser-only. If the Pixel hasn't loaded (ad blocker, slow network),
   the event is lost. No server-side CAPI backup exists for `Contact` events.
2. **No attribution:** Direct WhatsApp clicks do not pass through `submitLead`,
   so no UTM data is stored in the database.

**Mitigation Strategy:**
- Fire tracking events **before** opening the WhatsApp link.
- Use a brief `await` (100ms) to ensure the Pixel event is dispatched.
- Add a server-side `/api/track-contact` endpoint as a CAPI fallback for
  `Contact` events.
