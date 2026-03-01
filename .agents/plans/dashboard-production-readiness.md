# Dashboard Production Readiness Plan: Orders (Pedidos) CRUD

## Summary
This plan defines a production-ready implementation for the admin Orders module in `cej-landing`, covering full CRUD expectations (with delete implemented as controlled cancellation), backend-aligned type-safe forms/actions, robust UX states, and verification gates.

- Delete model: soft delete via `order_status='cancelled'`
- Update scope: status + schedule + payments (pricing snapshot immutable)
- Table experience: server-side pagination/filter/sort with URL params

## Implemented Scope (Execution Record)
- Added admin orders contracts in `types/internal/order-admin.ts`.
- Added Zod schemas in `lib/schemas/internal/order-admin.ts`.
- Added server actions:
  - `app/actions/listAdminOrders.ts`
  - `app/actions/getAdminOrderById.ts`
  - `app/actions/updateAdminOrder.ts`
  - `app/actions/cancelAdminOrder.ts`
  - `app/actions/listServiceSlots.ts`
  - `app/actions/listAssignableProfiles.ts`
- Extended create payload for seller assignment:
  - `types/internal/order.ts`
  - `lib/schemas/internal/order.ts`
  - `app/actions/createAdminOrder.ts`
- Reworked orders list page with URL-driven filters, sorting, and pagination:
  - `app/(admin)/dashboard/orders/page.tsx`
- Added order detail route with CRUD operation hub:
  - `app/(admin)/dashboard/orders/[id]/page.tsx`
  - `app/(admin)/dashboard/orders/[id]/OrderDetailClient.tsx`
  - `app/(admin)/dashboard/orders/[id]/page.module.scss`
- Added loading/error boundaries for orders module:
  - `app/(admin)/dashboard/orders/loading.tsx`
  - `app/(admin)/dashboard/orders/error.tsx`
- Upgraded admin create form with advanced scheduling/attribution and relational lookups:
  - `app/(admin)/dashboard/new/AdminOrderForm.tsx`

## Checklist (Foundation to Polish)
- [x] Define canonical admin-order DTOs and contracts.
- [x] Add shared Zod schemas for list/update/cancel payloads.
- [x] Implement paginated/sortable/filterable admin orders query action.
- [x] Implement order detail action with related data (payments/history/fiscal).
- [x] Implement operational order update action.
- [x] Implement soft-delete cancellation action with mandatory reason.
- [x] Implement lookups for service slots and assignable profiles.
- [x] Refactor orders list route with URL query state.
- [x] Add order detail route for update/status/payment/cancel operations.
- [x] Add loading and error route boundaries for orders segment.
- [x] Upgrade create form with backend-supported optional fields.
- [x] Add server feedback UX (`role="status"`, inline errors).
- [ ] Add and stabilize tests for new actions and detail page interactions.
- [ ] Complete full verification suite and resolve remaining issues.

## Context7 Status
Context7 MCP remains unreachable in this environment (`unknown MCP server 'Context7'`).
Implementation used local canonical sources (`docs/schema.sql`, `types/database.ts`, existing actions/schemas).

## Verification Commands (To Run)
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test --run`
- `pnpm build`
