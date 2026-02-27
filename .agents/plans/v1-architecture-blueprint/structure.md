# Architecture & Boundaries

> **Blueprint:** v1-architecture-blueprint
> **Last Updated:** 2026-02-27
> **Status:** Draft — Pending Review

---

## Implementation Progress

> **Last audited:** 2026-02-27 by Implementation Audit
> **Completion:** 50% (4/10 items — 2 partial)

| # | Item | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Adopt `(public)` and `(admin)` route-group split | ✅ | `app/(public)/layout.tsx`, `app/(admin)/layout.tsx` |
| 2 | Keep admin route group focused on dashboard surface (remove `cotizador`) | ✅ | `app/(admin)` |
| 3 | Introduce split stores (`usePublicStore`, `useAdminStore`) | ✅ | `store/public/usePublicStore.ts`, `store/admin/useAdminStore.ts` |
| 4 | Fully replace monolithic `useCejStore` usage with bounded stores | 🔶 | `store/useCejStore.ts` is still active across public flow |
| 5 | Scope `GlobalUI` to public layout instead of root | ⬜ | Not found (`app/layout.tsx` still mounts `GlobalUI`) |
| 6 | Scope `AuthProvider` to admin layout instead of root | ⬜ | Not found (`app/layout.tsx` still mounts `AuthProvider`) |
| 7 | Scope `PageViewTracker` and Pixel script to public layout | ⬜ | Not found (`app/layout.tsx` still mounts both) |
| 8 | Implement canonical root `middleware.ts` for auth/allowlist/security/_fbc | ⬜ | Not found (`proxy.ts` exists but canonical file is absent) |
| 9 | Enforce route allowlisting + 404 behavior at edge | 🔶 | `proxy.ts` enforces allowlist/404, but not via canonical `middleware.ts` entrypoint |
| 10 | Apply project-wide security headers through Next config | ✅ | `next.config.ts` |

## 1. High-Level Directory Organization

The system separates concerns via Next.js Route Groups. The canonical structure
enforces a strict boundary between the public-facing marketing surface and the
internal administrative ecosystem.

```
app/
├── (public)/                    # ← PUBLIC SURFACE (Landing + Legal + Shared Quote)
│   ├── layout.tsx               # Header, Footer, JSON-LD, SkipLink
│   ├── page.tsx                 # Landing page (/)
│   ├── aviso-de-privacidad/     # /aviso-de-privacidad
│   ├── terminos/                # /terminos
│   ├── cotizacion/[folio]/      # /cotizacion/:folio (shared quote view)
│   └── login/                   # /login (public auth entry)
│
├── (admin)/                     # ← ADMIN SURFACE (Dashboard)
│   ├── layout.tsx               # Auth boundary, admin shell, noindex
│   └── dashboard/               # /dashboard
│       ├── page.tsx             # Orders list
│       └── new/                 # /dashboard/new (create admin order)
│
├── actions/                     # Server Actions (shared, no route mapping)
│   ├── submitLead.ts
│   ├── createAdminOrder.ts
│   ├── getMyOrders.ts
│   ├── getPriceConfig.ts
│   └── getQuoteByFolio.ts
│
├── auth/                        # Supabase Auth callbacks
│   ├── callback/
│   └── login/
│
├── layout.tsx                   # Root layout (font, viewport, GA, conditional Pixel)
├── robots.ts
└── sitemap.ts
```

### Key Changes from Current State

| Current | Proposed | Rationale |
|:--------|:---------|:----------|
| `(marketing)` | `(public)` | Aligns naming with security domain, not marketing function |
| `(app)` contains `cotizador` + `dashboard` | `(admin)` contains only `dashboard` | `cotizador` is dead route; calculator lives on `/` |
| No middleware | `middleware.ts` at root | Enforces route protection at the edge |

---

## 2. State Management Boundaries

### 2.1 Current Problem: Monolithic Store Leakage

The current `useCejStore` is a single Zustand store that persists **all slices**
(calculator, cart, orders, user, submission, UI) into one `localStorage` key
(`cej-pro-storage`). This creates two critical issues:

1. **Bundle Leakage:** The `ordersSlice` (admin-only data) is imported into the
   root store, which is tree-shaken into both public and admin bundles.
2. **Data Contamination:** Admin order data persists even for public users who
   will never use the dashboard.

### 2.2 Prescribed Solution: Split Stores

```
store/
├── public/
│   ├── usePublicStore.ts        # Calculator, Cart, User, Submission, UI slices
│   └── slices/
│       ├── calculatorSlice.ts
│       ├── cartSlice.ts
│       ├── uiSlice.ts
│       ├── userSlice.ts
│       └── submissionSlice.ts
│
└── admin/
    ├── useAdminStore.ts         # Orders, CRM, Expenses (admin-only)
    └── slices/
        └── ordersSlice.ts
```

**Rules:**

1. `usePublicStore` **MUST NEVER** import anything from `store/admin/`.
2. `useAdminStore` **MAY** import shared types from `types/` but **MUST NOT**
   import from `store/public/`.
3. `GlobalUI.tsx` **MUST** be scoped to `(public)/layout.tsx`, not `app/layout.tsx`.
4. The `localStorage` key for `usePublicStore` remains `cej-pro-storage` (migration-safe).
5. The `localStorage` key for `useAdminStore` uses `cej-admin-storage` (new namespace).

### 2.3 Root Layout Cleanup

The root `app/layout.tsx` currently mounts these client-heavy components globally:

| Component | Current Scope | Proposed Scope |
|:----------|:-------------|:---------------|
| `AuthProvider` | Root layout (all routes) | `(admin)/layout.tsx` only |
| `GlobalUI` (Toast, Drawer, BottomBar) | Root layout (all routes) | `(public)/layout.tsx` only |
| `PageViewTracker` | Root layout (all routes) | `(public)/layout.tsx` only |
| FB Pixel `<Script>` | Root layout (all routes) | `(public)/layout.tsx` only |
| GA `<Script>` | Root layout (all routes) | Root layout (keep global) |

**Impact:** Decoupling `AuthProvider` from root layout eliminates the Supabase
client SDK from the public bundle (~15KB gzipped), directly improving LCP.

---

## 3. Routing Rules & Middleware Protection

### 3.1 Allowed Routes (Exhaustive Allowlist)

```typescript
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/aviso-de-privacidad',
  '/terminos',
  '/cotizacion/:folio',
];

const PROTECTED_ROUTES = [
  '/dashboard',
  '/dashboard/new',
];

const AUTH_CALLBACK_ROUTES = [
  '/auth/callback',
];
```

Any request not matching these patterns **MUST** return a `404` response. No
catch-all fallback routes are permitted.

### 3.2 Middleware Strategy

Create `middleware.ts` at the project root:

```
Priority: Edge Runtime (runs before any rendering)
```

**Responsibilities:**

1. **Dashboard Protection:** All requests to `/dashboard/*` MUST verify the
   Supabase session cookie. If absent → redirect to `/login`.
2. **Session Refresh:** Call `supabase.auth.getUser()` on every request to
   refresh the auth token (Supabase SSR pattern).
3. **CORS Headers:** Set strict `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
   on all responses.
4. **UTM Persistence:** Capture `fbclid` from query params and set the `_fbc`
   cookie if not already present (critical for CAPI attribution).
5. **Route Allowlisting:** Return 404 for any route not in the allowlist.

```typescript
// middleware.ts — Structural Skeleton
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
```

### 3.3 Defense in Depth (Layered Auth)

| Layer | Location | Responsibility |
|:------|:---------|:---------------|
| **Edge** | `middleware.ts` | Session cookie check, redirect to `/login` |
| **Server** | `(admin)/layout.tsx` | `getUser()` verification, RBAC check |
| **Client** | `AuthProvider` (admin-only) | UI state for conditional rendering |

> [!IMPORTANT]
> The dashboard layout's server-side `getUser()` check remains as
> the authoritative guard. Middleware provides defense-in-depth and prevents
> bundle download from unauthenticated browsers.

---

## 4. Bundle Isolation Verification

To verify that admin code does not leak into the public bundle:

```bash
# Build and analyze
pnpm build
# Check the .next/server/chunks/ output for any admin references
# in public route chunks
```

**Automated Guard (CI):**
Add a build-time check that scans the Webpack chunk graph for any import path
matching `store/admin/` appearing in chunks assigned to `(public)` route groups.

---

## 5. Security Headers (next.config.ts)

```typescript
// next.config.ts additions
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];
```

These headers **MUST** be applied to all responses via `next.config.ts` `headers()`.
