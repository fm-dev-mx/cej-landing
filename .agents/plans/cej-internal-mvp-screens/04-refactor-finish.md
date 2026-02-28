# 04 - Refactor Finish Guide

## Objective
Close implementation with consistent architecture, clean repository state, and release-ready quality controls.

## Step-By-Step Finish Procedure
1. Complete all accepted tasks for active phase and freeze feature additions.
2. Consolidate route naming and canonical internal navigation.
3. Remove deprecated/internal dead paths introduced by migration.
4. Normalize schema/type/action naming across internal modules.
5. Update docs and changelog with final behavior and constraints.
6. Run full QA gates.
7. Prepare release checklist and rollout notes.

## Cleanup Checklist
- [ ] Remove duplicate login route or redirect it to canonical path.
- [ ] Remove temporary adapters/shims used during persistence transition.
- [ ] Ensure no new module uses deprecated `store/useCejStore.ts` bridge.
- [ ] Normalize file naming and route grouping under `app/(admin)/dashboard/*`.
- [ ] Align `types/database.ts` with implemented internal tables/contracts.
- [ ] Delete dead styles/components not referenced by internal routes.

## QA Checklist
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm test:e2e` (or targeted e2e sanity subset if full suite is too slow)
- [ ] Manual auth/RBAC sanity
- [ ] Manual order create -> list -> calendar flow sanity
- [ ] Manual expense/payroll/report/export sanity
- [ ] Regression check on public calculator/quote/submit flow

## Release Checklist
- [ ] Confirm env vars in deployment target:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `MONITORING_WEBHOOK_URL` (if used)
  - Existing tracking vars remain intact
- [ ] Apply required SQL migrations for internal tables/columns.
- [ ] Run or document backfill scripts (if adding attribution/order fields).
- [ ] Verify seed scripts for local/staging reproducibility (if any new seeders are added).
- [ ] Update release notes with behavior changes and known limitations.

## Definition Of Done (DoD)
All criteria must be true:
- [ ] Internal MVP Phase 1 routes are implemented and accessible by role.
- [ ] Internal order persistence/listing consistency is resolved.
- [ ] Calendar, expenses, payroll, reports are functional at MVP baseline.
- [ ] CSV export works for filtered report views.
- [ ] Test suite and build pass on CI/local baseline.
- [ ] Public funnel behavior remains stable and verified.
- [ ] Documentation and changelog are updated and coherent.
- [ ] No unresolved P0/P1 audit risks remain for released scope.
