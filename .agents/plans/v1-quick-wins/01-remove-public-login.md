# Step 01 — Remove Login Button from Public Landing

**Estimated effort:** ~30min
**Risk:** Very Low — UI-only change, no server logic
**Depends on:** Nothing (can be done independently)
**Blocks:** Nothing

---

## Pre-conditions

- [ ] Step 00 is committed (or this can run in parallel on its own branch)
- [ ] `pnpm test --run` passes on `main`

---

## Context

The current `Header.tsx` renders a conditional auth block (lines 69–77):

```tsx
// Current behavior:
{!authLoading && (
  user ? (
    <UserProfileMenu userName={userName} userEmail={userEmail} />
  ) : (
    <Link href="/login" className={`${styles.button} ${styles.buttonLogin}`}>
      Iniciar Sesión
    </Link>
  )
)}
```

This exposes the admin login path (`/login`) to every visitor and creates visual noise competing with the WhatsApp CTA. The `UserProfileMenu` is only meaningful for admins, not anonymous leads.

**Decision:** Remove the entire auth block from the public Header. The admin accesses the dashboard by navigating directly to `/login` — no public link needed.

---

## Files to Modify

> **Scope note:** Pre-execution audit confirmed that `MobileMenu.tsx`, `useHeaderLogic.ts`, and `header.types.ts` already contain **no auth-related UI or logic**. Only `Header.tsx` requires modification.

### `components/layouts/Header/Header.tsx` — only file to touch

- Remove the `useAuth` import and the `user`, `authLoading`, `userName`, `userEmail` variables.
- Remove the auth conditional block (the whole `{!authLoading && (...)}` block).
- Keep all other actions: history button, WhatsApp, phone.
- Remove the `UserProfileMenu` import if it has no other uses in this file.

```tsx
// REMOVE these lines:
import { useAuth, UserProfileMenu } from "@/components/Auth";
const { user, loading: authLoading } = useAuth();
const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
const userEmail = user?.email || '';

// REMOVE this JSX block:
{!authLoading && (
  user ? (
    <UserProfileMenu ... />
  ) : (
    <Link href="/login" ...>Iniciar Sesión</Link>
  )
)}
```

> ✅ `MobileMenu.tsx` — no login UI present. No changes needed.
> ✅ `useHeaderLogic.ts` — no `useAuth` call present. No changes needed.
> ✅ `header.types.ts` — no auth-related types. No changes needed.

---

## What NOT to Change

- Do **not** delete `components/Auth/` — it is still used by the admin dashboard.
- Do **not** delete `/app/auth/` or `/app/(app)/dashboard/` routes.
- Do **not** remove `AuthProvider` from `app/layout.tsx` — still needed server-side for protected routes.
- Do **not** change `MobileMenu`'s navigation items — only remove auth-related UI.

---

## Tests to Write / Update

### `components/layouts/Header/Header.test.tsx` (new or update)

- [ ] `it('does not render a login link in the public header')`
  - Render `<Header />`, assert `screen.queryByRole('link', { name: /iniciar sesión/i })` is `null`
- [ ] `it('does not render UserProfileMenu when no user is logged in')`
- [ ] `it('still renders the WhatsApp button')`
- [ ] `it('still renders the history/cart button')`

### `tests/snapshot-integrity.test.ts`

- Update any failing snapshots caused by the removal of the login block.

---

## Commit

```
feat(header): remove public login button to reduce landing page friction

- Remove auth conditional block from Header desktop actions
- Remove login link from MobileMenu
- Remove unused useAuth import from Header component
- Add/update Header unit tests asserting no login UI in public view
```

---

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test --run
```

**Manual check:** Visit `http://localhost:3000` — no "Iniciar Sesión" button should be visible in header or mobile menu. Navigate to `http://localhost:3000/login` — should still work (not 404).
