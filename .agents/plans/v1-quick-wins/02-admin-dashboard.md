# Step 02 — Admin Dashboard: Route Protection & Order Registration

**Estimated effort:** ~3–4h
**Risk:** Medium — new route group, new Supabase queries (route protection handled by existing `proxy.ts`)
**Depends on:** Step 01 (login link removed from public; login page must exist independently)
**Blocks:** Nothing (the public funnel is independent of this)

---

## Implementation Progress

> **Last audited:** 2026-02-27 by Audit v3 — Full Codebase Re-verification
> **Completion:** 89% (8/9 items — 1 partial)

| # | Item | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Add server-side auth redirect in dashboard layout | ✅ | `app/(admin)/dashboard/layout.tsx` |
| 2 | ~~Create `lib/supabase/middleware.ts` helper~~ | N/A | Absorbed by `proxy.ts` — Supabase client is created inline in the proxy function |
| 3 | Add edge-level dashboard preflight guard | ✅ | `proxy.ts` — `isDashboardRoute()` + `getUser()` check + redirect to `/login` with `redirect` param |
| 4 | Ensure login route/page supports admin access and redirect semantics | ✅ | `app/(public)/login/page.tsx` |
| 5 | Create dedicated admin server action (no Pixel/CAPI) | ✅ | `app/actions/createAdminOrder.ts` |
| 6 | Add `+ Nuevo Pedido` CTA in dashboard page | ✅ | `app/(admin)/dashboard/page.tsx` |
| 7 | Render status badge mapping in dashboard order list | ✅ | `app/(admin)/dashboard/OrdersList.tsx` |
| 8 | Add `/dashboard/new` page + admin order form fields | ✅ | `app/(admin)/dashboard/new/page.tsx` |
| 9 | Add proxy/auth guard tests (`proxy.test.ts`) | ✅ | `proxy.test.ts` — 4 test cases (redirect unauth, 404, authenticated access, fail-open) |
| 10 | Add createAdminOrder tests including explicit no-CAPI assertion | 🔶 | `app/actions/createAdminOrder.test.ts` covers insert/error/auth; missing explicit `sendToMetaCAPI` assertion |

## Pre-conditions

- [ ] Step 01 is committed
- [ ] Supabase project has at least one admin user created
- [ ] `pnpm test --run` passes

---

## Context & Design Decision

**Pre-execution audit findings (GAP-03, GAP-04, GAP-05):**

1. **`app/(app)/dashboard/layout.tsx` already calls `getUser()`** — but does NOT redirect unauthenticated users. The primary fix is a one-line redirect, not building protection from scratch.
2. **`@supabase/ssr` is already installed** — it is used in `lib/supabase/server.ts`. No new dependencies are needed.
3. **Admin order creation must NOT modify `submitLead.ts`** — that action belongs to the public funnel. Admin orders must have their own dedicated Server Action (`createAdminOrder.ts`).

**Why not full RBAC in this phase?**
Only authenticated Supabase users will exist; one team. Full RBAC (roles table, RLS) is deferred to Phase 2 as documented in `docs/ARCHITECTURE.md §8.1`.

---

## Route Architecture

```text
app/
├── (public)/                 ← Public, no auth
├── (admin)/
│   └── dashboard/            ← PROTECTED — proxy.ts redirects to /login if no session
│       ├── layout.tsx        ← Server-side auth redirect (defense-in-depth)
│       ├── page.tsx          ← [MODIFY] Add "+ Nuevo Pedido" button
│       └── new/              ← [NEW] Admin order creation form
│           └── page.tsx
├── (public)/login/           ← Login page accessible at /login
│   └── page.tsx
├── actions/
│   └── createAdminOrder.ts   ← [NEW] Dedicated admin Server Action
proxy.ts                      ← Edge-level auth guard for /dashboard/** (Next.js 16 convention)
lib/
└── supabase/
    ├── server.ts             ← existing, unchanged
    └── client.ts             ← existing, unchanged
```

---

## Files to Create / Modify

### 1. `app/(app)/dashboard/layout.tsx` — PRIMARY FIX

The existing layout already calls `getUser()` but ignores the result. Add the redirect:

```ts
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <>{children}</>;
}
```

This is the **correct and sufficient** primary auth guard per the existing codebase pattern.

> **Note:** The original plan proposed creating `lib/supabase/middleware.ts` and a root `middleware.ts` as a secondary preflight guard. This is **no longer needed** — `proxy.ts` (the project's authoritative routing engine, Next.js 16 convention) already implements the equivalent edge-level guard with `isDashboardRoute()` + `getUser()` + redirect logic. See `proxy.ts` lines 47–126 for the full implementation.

### 4. `app/auth/login/page.tsx` — VERIFY / CREATE IF MISSING

- Check if `app/auth/` already has a functioning login page.
- If missing or broken, create a minimal email+password form using `supabase.auth.signInWithPassword()`.
- On success: read `redirectTo` query param and redirect (default to `/dashboard`).
- Add `robots: 'noindex, nofollow'` to metadata.
- UI copy in Spanish: `"Correo electrónico"`, `"Contraseña"`, `"Iniciar sesión"`, `"Credenciales incorrectas. Intente de nuevo."`

### 5. `app/actions/createAdminOrder.ts` — NEW (separate from submitLead)

**A dedicated Server Action for admin use.** Never calls CAPI. Never fires Pixel.

```ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { reportError } from '@/lib/monitoring';
import { generateQuoteId } from '@/lib/utils';

export type AdminOrderPayload = {
  name: string;
  phone: string;
  volume: number;
  concreteType: 'direct' | 'pumped';
  strength: string;
  deliveryAddress: string;
  deliveryDate?: string;
  notes?: string;
};

export type AdminOrderResult =
  | { status: 'success'; id: string }
  | { status: 'error'; message: string };

export async function createAdminOrder(payload: AdminOrderPayload): Promise<AdminOrderResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Server-side auth guard (defense-in-depth)
    if (!user) redirect('/login');

    const folio = generateQuoteId();

    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: payload.name,
        phone: payload.phone,
        status: 'new',
        utm_source: 'admin_dashboard',
        utm_medium: 'internal',
        privacy_accepted: true,
        privacy_accepted_at: new Date().toISOString(),
        quote_data: {
          folio,
          items: [{
            id: crypto.randomUUID(),
            label: `Concreto ${payload.concreteType === 'pumped' ? 'Bomba' : 'Directo'} f'c ${payload.strength}`,
            volume: payload.volume,
            service: payload.concreteType,
            subtotal: 0, // Admin orders do not calculate price at registration time
          }],
          financials: { subtotal: 0, vat: 0, total: 0, currency: 'MXN' },
          metadata: {
            source: 'admin_dashboard',
            deliveryAddress: payload.deliveryAddress,
            deliveryDate: payload.deliveryDate,
            notes: payload.notes,
          },
        },
      })
      .select('id')
      .single();

    if (error) {
      reportError(new Error(error.message), { source: 'createAdminOrder', code: error.code });
      return { status: 'error', message: 'No se pudo registrar el pedido. Intente de nuevo.' };
    }

    return { status: 'success', id: String(data.id) };
  } catch (err) {
    reportError(err, { source: 'createAdminOrder' });
    return { status: 'error', message: 'Error inesperado al registrar el pedido.' };
  }
}
```

### 6. `app/(app)/dashboard/page.tsx` — MODIFY

- Add `<Link href="/dashboard/new">+ Nuevo Pedido</Link>` button in the header section.
- Display order status as a colored badge (map `status` values to CSS classes using existing token colors).
- Keep the existing `OrdersList` and `getMyOrders` action — do not replace them.

### 7. `app/(app)/dashboard/new/page.tsx` — NEW

Admin order creation form that calls `createAdminOrder`. Fields:
- `Nombre del cliente` (text, required)
- `Teléfono` (text, required)
- `Volumen (m³)` (number, required)
- `Tipo de servicio` (select: Directo / Bomba)
- `Resistencia` (select: f'c 150, 200, 250, 300)
- `Dirección de entrega` (text, required)
- `Fecha estimada` (date, optional)
- `Notas` (textarea, optional)

On success: redirect to `/dashboard` with a success toast/banner.

---

## Tests to Write

### `proxy.test.ts` (edge-level auth guard)

- [ ] `it('redirects unauthenticated /dashboard requests to /login with redirect param')`
- [ ] `it('allows authenticated /dashboard requests to pass through')`
- [ ] `it('passes through if Supabase is not configured (fail-open)')`
- [ ] `it('returns 404 for unknown routes')`

### `app/actions/createAdminOrder.test.ts`

- [ ] `it('inserts a new lead row with admin_dashboard UTM source')`
- [ ] `it('returns error result (not throw) on DB failure')`
- [ ] `it('redirects to /login if user is not authenticated')`
- [ ] `it('never calls sendToMetaCAPI')`

---

## Commit Strategy

```text
# Commit A — auth guard (layout + proxy already handles edge)
fix(dashboard): add redirect on unauthenticated access in layout

- dashboard/layout.tsx now redirects to /login when no session
- proxy.ts already handles edge-level guard (no middleware.ts needed)
- Add proxy.test.ts auth guard tests

# Commit B — admin order creation
feat(dashboard): add admin-only order creation flow

- New createAdminOrder Server Action (never calls CAPI or Pixel)
- New /dashboard/new page with order creation form
- Add + Nuevo Pedido CTA to dashboard page
- Add createAdminOrder tests
```

---

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test --run
```

**Manual check:**
1. Incognito → navigate to `http://localhost:3000/dashboard` → redirected to `/login`.
2. Log in → lands on `/dashboard`.
3. Click `+ Nuevo Pedido` → fill form → submit → row in Supabase `leads` table with `utm_source: 'admin_dashboard'`.
4. Confirm Pixel/CAPI events are **not** fired (check Meta Events Manager — no `Lead` event).
