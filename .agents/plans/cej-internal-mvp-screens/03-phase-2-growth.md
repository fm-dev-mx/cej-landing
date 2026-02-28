# 03 - Phase 2 Growth (Enhancements)

## Scope
Phase 2 adds growth and observability enhancements once Phase 1 data contracts are stable:
- Order origin and attribution normalization
- Alerts and automation hooks
- Richer report dimensions and conversion analytics
- Export enhancements beyond baseline CSV

## Implementation Percentage
- **Current implementation (Phase 2 scope): 18%**
- **Target after Phase 2: 88%**

Estimation method:
- Existing attribution/tracking primitives in public funnel provide partial foundation.
- Internal analytics normalization, automation, and advanced exports are mostly absent.

## Ordered Tasks

### Task 1 - Attribution Fields Normalization On Orders
Purpose:
- Add internal analytics visibility by source/channel/campaign at order level.

Touched files:
- Existing:
  - `app/actions/createAdminOrder.ts`
  - `app/actions/submitLead.ts` (integration compatibility only)
  - `types/database.ts`
- New:
  - `app/actions/listAttributionReport.ts` (optional split)
  - `types/internal/attribution.ts`
  - `lib/schemas/internal/attribution.ts`

Acceptance criteria:
- Orders store normalized origin fields (`origin`, `utm_source`, `utm_medium`, `utm_campaign`, etc.).
- Dashboard/report filters can segment by origin/source.
- Backfill strategy documented for legacy rows.

Tests to add/adjust:
- Attribution mapping tests for order creation and report filters.

Suggested commit:
- `feat(attribution): add order-origin fields and growth reporting hooks`

### Task 2 - Dashboard Alerts And Automation Hooks
Purpose:
- Improve operational response with threshold-based signals.

Touched files:
- New:
  - `app/actions/getOperationalAlerts.ts`
  - `lib/internal/alerts.ts`
  - `types/internal/alerts.ts`

Acceptance criteria:
- Alerts generated for configurable conditions (for example: delayed scheduled orders, abnormal expense spikes).
- Alerts are read-only in dashboard initially; action automation remains optional.

Tests to add/adjust:
- Alert rule engine unit tests.

Suggested commit:
- `feat(dashboard): add operational alerts and automation-ready hooks`

### Task 3 - Richer Reports (Source/Channel/Cohort/Conversion Lag)
Purpose:
- Expand decision support beyond baseline totals.

Touched files:
- Existing:
  - `app/(admin)/dashboard/reports/page.tsx`
  - `app/actions/exportReport.ts`
- New:
  - `app/(admin)/dashboard/reports/attribution/page.tsx` (or integrated tab)

Acceptance criteria:
- Reports support breakdown by source/channel and selected period.
- Conversion-lag metric is defined and consistently calculated.

Tests to add/adjust:
- Aggregate metric tests for cohort and lag calculations.

Suggested commit:
- `feat(reports): add attribution and cohort breakdown metrics`

### Task 4 - Export Enhancements (Optional XLSX/PDF)
Purpose:
- Provide richer outbound reporting for management workflows.

Touched files:
- Existing:
  - `app/actions/exportReport.ts`
- New:
  - export format adapters (`lib/internal/export/*`)

Acceptance criteria:
- CSV remains canonical and stable.
- Optional XLSX/PDF exports are feature-flagged and do not break CSV path.

Tests to add/adjust:
- Export parity tests ensuring totals and row counts match across formats.

Suggested commit:
- `feat(reports): extend exports with optional xlsx/pdf adapters`

## QA Notes For Phase 2
- Re-run full quality gates:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`
  - `pnpm test:e2e`
- Validate report consistency across filters and export formats.
- Confirm Phase 1 routes remain stable with added attribution dimensions.
