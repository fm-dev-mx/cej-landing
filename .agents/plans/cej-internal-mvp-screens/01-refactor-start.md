# 01 - Refactor Start Guide

## Objective
Start implementation with minimal regression risk while preserving current production behavior in public calculator and tracking flows.

## Branch Strategy
- Create a dedicated branch:
  - `feat/internal-mvp-phase-1`
- If work is split by module, use child branches from Phase 1 baseline:
  - `feat/internal-mvp-orders`
  - `feat/internal-mvp-calendar`
  - `feat/internal-mvp-finance`

## Commit Strategy (Safe Checkpoints)
Use small, reversible Conventional Commits with deterministic boundaries:
1. `docs(plan): add internal MVP screens audit and phased refactor blueprint`
2. `feat(dashboard): align internal order persistence and listing source`
3. `feat(dashboard): add operational KPI cards and summary action`
4. `feat(calendar): add day-week order slots view for dispatch planning`
5. `feat(orders): add server-side filters and status transition action`
6. `feat(expenses): add basic expense capture and listing flow`
7. `feat(payroll): add basic payroll capture and summary`
8. `feat(reports): add baseline operational-financial report with csv export`
9. `feat(attribution): add order-origin fields and growth reporting hooks`
10. `chore(internal): remove dead paths and normalize naming/docs`

## First Steps (Do Not Break Existing Behavior)
1. Freeze and protect current core calculation behavior.
2. Add/expand tests around:
   - `lib/logic/orderDispatcher.ts`
   - `lib/pricing.ts`
   - `app/actions/getMyOrders.ts`
3. Normalize persistence direction for internal order flow before UI expansion:
   - Resolve `leads` vs `orders` write/read divergence.
4. Keep public funnel untouched while internal modules are introduced.

## Rollback Notes By Checkpoint
- If persistence changes break listing, revert only the order persistence commit and keep docs/test additions.
- If KPI aggregation introduces query instability, rollback KPI action/UI commit only.
- If calendar introduces schema friction, park calendar under feature flag route while preserving orders list module.
- If finance modules fail QA, keep Phase 1 release with orders + dashboard + reports baseline only.

## Definition Of Ready (DoR)
Implementation starts only when all are true:
- [ ] Route map approved (`/dashboard`, `/dashboard/orders`, `/dashboard/calendar`, `/dashboard/expenses`, `/dashboard/payroll`, `/dashboard/reports`).
- [ ] Canonical login route chosen and duplicate route disposition decided.
- [ ] Order persistence source-of-truth agreed (`orders`-centric internal flow).
- [ ] Initial internal schemas drafted (orders/expenses/payroll/report filters).
- [ ] Required env vars and migration needs documented.
- [ ] Baseline checks pass locally before coding changes:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`

## Definition Of Safe Start
- No architecture-sensitive module is changed without explicit schema and action contract.
- No heavy new dependency is added for MVP features.
- Public calculator submission and tracking paths remain behaviorally unchanged.
