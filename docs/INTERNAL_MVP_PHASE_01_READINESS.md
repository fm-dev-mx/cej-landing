# Internal MVP Phase 01 Readiness

## Scope

This document captures the "safe start" contracts and checks completed for `01-refactor-start` before moving into `02-phase-1-mvp`.

## Canonical Routes

- `/login` is the canonical auth entrypoint for dashboard access.
- `/auth/login` remains as a legacy alias that redirects server-side to `/login`.
- Existing operational routes in repository:
  - `/dashboard`
  - `/dashboard/new`
- Planned MVP routes mapped for Phase 1 implementation:
  - `/dashboard/orders`
  - `/dashboard/calendar`
  - `/dashboard/expenses`
  - `/dashboard/payroll`
  - `/dashboard/reports`

## Internal Contracts (Initial)

- `createAdminOrder(payload)` now writes internal manual orders into `public.orders`.
- `getMyOrders()` reads from `public.orders` and returns a stable `OrderSummary` mapping.
- Internal payload and item contracts are defined in:
  - `types/internal/order.ts`
  - `lib/schemas/internal/order.ts`
- Database table typing now includes `public.orders` in `types/database.ts`.

## Compatibility Guarantees

- Public funnel behavior remains unchanged:
  - `submitLead` path still targets `public.leads`.
  - Tracking/CAPI behavior is not changed, only test typing was fixed.
- Dashboard auth boundary still redirects unauthenticated users to `/login`.

## Migration And Env Notes

- No new environment variables were introduced in Phase 01.
- Migration dependency for MVP Phase 1:
  - `public.orders` must exist with columns used by `createAdminOrder`:
    `user_id`, `folio`, `status`, `total_amount`, `currency`, `items`, `delivery_date`, `delivery_address`.
- Existing `docs/schema.sql` already defines the required `orders` shape.

## Validation Baseline For Phase 01 Closure

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build` (release readiness gate)
