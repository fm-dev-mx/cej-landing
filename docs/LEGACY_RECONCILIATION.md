# Legacy Reconciliation Runbook

This runbook executes the dual-track legacy pipeline introduced in `20260302_legacy_reconciliation_foundation.sql`.

## 1) Apply schema

```bash
# Run in Supabase SQL editor or your migration runner
# docs/migrations/20260302_legacy_reconciliation_foundation.sql
```

## 2) Stage raw CSVs

```bash
pnpm db:stage-legacy
# or per source
pnpm tsx scripts/stage-legacy-csv.ts --source=productos
```

## 3) Normalize + promote products

```bash
pnpm tsx scripts/promote-products-from-staging.ts --batch-id=<legacy_ingest_batches.id>
```

## 4) Validate

```bash
pnpm governance:check-db-contracts
pnpm typecheck
```

## Notes

- Canonical tables now include `record_origin` and `source_batch_id` to support legacy + system-captured coexistence.
- Reporting should read from:
  - `analytics.v_orders_unified`
  - `analytics.v_expenses_unified`
  - `analytics.v_payroll_unified`
- Rejected records are stored in `public.legacy_row_rejections`.
