# Step 02 — Admin Dashboard: Route Protection & Order Registration

**Estimated effort:** ~3–4h
**Risk:** Medium — introduces middleware, new route group, new Supabase queries
**Depends on:** Step 01 (login link removed from public; login page must exist independently)
**Blocks:** Nothing (the public funnel is independent of this)

---

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

```
app/
├── (marketing)/              ← Public, no auth
├── (app)/
│   ├── cotizador/
│   └── dashboard/            ← PROTECTED — redirect to /login if no session
│       ├── layout.tsx        ← [FIX] Add redirect() after auth check
│       ├── page.tsx          ← [MODIFY] Add "+ Nuevo Pedido" button
│       └── new/              ← [NEW] Admin order creation form
│           └── page.tsx
├── auth/
│   └── login/                ← [VERIFY] Login page still accessible at /login
│       └── page.tsx
├── actions/
│   └── createAdminOrder.ts   ← [NEW] Dedicated admin Server Action
└── middleware.ts             ← [NEW] Secondary preflight guard (defense-in-depth)
lib/
└── supabase/
    ├── server.ts             ← existing, unchanged
    ├── client.ts             ← existing, unchanged
    └── middleware.ts         ← [NEW] Supabase client helper for middleware context
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

### 2. `lib/supabase/middleware.ts` — NEW

Create a Supabase client factory for the middleware context, following the same encapsulation pattern as `lib/supabase/server.ts`. This avoids duplicating cookie-handling logic inline in `middleware.ts`:

```ts
import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import { getSupabaseConfig } from '@/config/env';

export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  return createServerClient(url!, anonKey!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
}
```

### 3. `middleware.ts` — NEW (project root, next to `package.json`)

Secondary preflight guard to prevent flash of unauthenticated dashboard content:

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createMiddlewareClient(request, response);

  // If Supabase is not configured (e.g. local dev without env), pass through.
  if (!supabase) return response;

  // Refresh session — required to keep server-side session alive.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

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

### `lib/supabase/middleware.test.ts`

- [ ] `it('returns null when Supabase is not configured')`
- [ ] `it('creates client with correct cookie handling')`

### `middleware.test.ts`

- [ ] `it('redirects unauthenticated requests to /login with redirectTo param')`
- [ ] `it('allows authenticated requests to pass through')`
- [ ] `it('passes through if Supabase is not configured (fail-open)')`

### `app/actions/createAdminOrder.test.ts`

- [ ] `it('inserts a new lead row with admin_dashboard UTM source')`
- [ ] `it('returns error result (not throw) on DB failure')`
- [ ] `it('redirects to /login if user is not authenticated')`
- [ ] `it('never calls sendToMetaCAPI')`

---

## Commit Strategy

```
# Commit A — auth guard fix (primary)
fix(dashboard): add redirect on unauthenticated access in layout

- dashboard/layout.tsx now redirects to /login when no session
- Add lib/supabase/middleware.ts Supabase client factory

# Commit B — middleware (secondary guard)
feat(auth): add Next.js middleware as preflight guard for /dashboard

- middleware.ts intercepts /dashboard/** without session
- Add middleware unit tests

# Commit C — admin order creation
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
