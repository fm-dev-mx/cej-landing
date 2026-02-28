# 02 - Phase 1 MVP (Operational Core)

## Scope
Phase 1 delivers the smallest shippable internal operations system:
- Order capture aligned to internal data source
- Dashboard KPI v1
- Orders calendar (day/week slots)
- Orders list with filters and status updates
- Expenses capture (basic)
- Payroll capture (basic)
- Basic reports with CSV export

Deferred to Phase 2:
- Attribution analytics depth
- Alerts/automation
- Enhanced exports beyond CSV-first baseline

## Implementation Percentage
- **Current implementation: 32%**
- **Target after Phase 1: 74%**

Estimation method:
- Weighted completion across requested MVP features based on repository audit evidence.
- Existing partial features (auth/dashboard/list/capture) counted proportionally.
- Missing modules (calendar/expenses/payroll/reports/KPI/status transitions) currently weighted as near-zero completion.

## Ordered Tasks

### Task 1 - Unify Internal Order Persistence Path
Purpose:
- Remove operational mismatch by making internal creation and listing use the same source (`orders`-centric path).

Touched files:
- Existing:
  - `app/actions/createAdminOrder.ts`
  - `app/actions/getMyOrders.ts`
  - `app/(admin)/dashboard/new/AdminOrderForm.tsx`
  - `types/database.ts`
- New:
  - `lib/schemas/internal/order.ts` (or equivalent)
  - `types/internal/order.ts`

Acceptance criteria:
- New internal order appears in dashboard list after creation.
- Status and financial snapshot fields are persisted consistently.
- No regression in public `submitLead` pipeline.

Tests to add/adjust:
- `app/actions/createAdminOrder.test.ts`:
  - verifies write target/data shape consistency with list query expectations
- `app/actions/getMyOrders.test.ts` (new):
  - validates return mapping for new records

Suggested commit:
- `feat(dashboard): align internal order persistence and listing source`

### Task 2 - Dashboard KPI v1
Purpose:
- Add operational and financial summary cards for fast daily visibility.

Touched files:
- Existing:
  - `app/(admin)/dashboard/page.tsx`
  - `app/(admin)/dashboard/page.module.scss`
- New:
  - `app/actions/getDashboardKpis.ts`
  - `types/internal/reporting.ts`

Acceptance criteria:
- Dashboard shows at least: total orders, scheduled today, pending, revenue total period.
- KPI query supports a default period (current week/month definition documented).

Tests to add/adjust:
- `app/actions/getDashboardKpis.test.ts` (new)

Suggested commit:
- `feat(dashboard): add operational KPI cards and summary action`

### Task 3 - Calendar v1 (Day/Week)
Purpose:
- Provide dispatch/operations visibility by delivery date and slot.

Touched files:
- New:
  - `app/(admin)/dashboard/calendar/page.tsx`
  - `app/(admin)/dashboard/calendar/page.module.scss`
  - `app/actions/listOrders.ts` (shared listing/filter action)
  - `components/internal/Calendar/*`

Acceptance criteria:
- Day and week views render orders grouped by slot/time window.
- Empty slot state is explicit.
- Clicking a slot item links to order detail/list context.

Tests to add/adjust:
- `app/actions/listOrders.test.ts` (new) for date-range filters
- `components/internal/Calendar/*.test.tsx` (new)

Suggested commit:
- `feat(calendar): add day-week order slots view for dispatch planning`

### Task 4 - Orders List Filters + Status Transition Flow
Purpose:
- Convert current list into operational queue with controlled status updates.

Touched files:
- Existing:
  - `app/(admin)/dashboard/OrdersList.tsx`
- New:
  - `app/(admin)/dashboard/orders/page.tsx`
  - `app/actions/updateOrderStatus.ts`
  - `lib/schemas/internal/order-status.ts`

Acceptance criteria:
- Server-side filters: status, date range, folio/client search.
- Allowed transition matrix enforced on backend.
- Invalid transitions return typed errors and do not mutate data.

Tests to add/adjust:
- `app/actions/updateOrderStatus.test.ts` (new)
- `app/actions/listOrders.test.ts` (extend)

Suggested commit:
- `feat(orders): add server-side filters and status transition action`

### Task 5 - Expenses Capture v1
Purpose:
- Record basic operational expenses to support KPI and reporting.

Touched files:
- New:
  - `app/(admin)/dashboard/expenses/page.tsx`
  - `app/actions/createExpense.ts`
  - `app/actions/listExpenses.ts`
  - `types/internal/expense.ts`
  - `lib/schemas/internal/expense.ts`

Acceptance criteria:
- Expense form captures amount, category, date, notes/reference.
- Expenses list paginates and filters by date/category.

Tests to add/adjust:
- `app/actions/createExpense.test.ts` (new)
- `app/actions/listExpenses.test.ts` (new)

Suggested commit:
- `feat(expenses): add basic expense capture and listing flow`

### Task 6 - Payroll Capture v1 (Basic)
Purpose:
- Capture payroll entries at basic operational level for reporting.

Touched files:
- New:
  - `app/(admin)/dashboard/payroll/page.tsx`
  - `app/actions/createPayrollEntry.ts`
  - `app/actions/listPayrollEntries.ts`
  - `types/internal/payroll.ts`
  - `lib/schemas/internal/payroll.ts`

Acceptance criteria:
- Payroll entry supports employee label/reference, period, amount, notes.
- List supports period filtering.

Tests to add/adjust:
- `app/actions/createPayrollEntry.test.ts` (new)
- `app/actions/listPayrollEntries.test.ts` (new)

Suggested commit:
- `feat(payroll): add basic payroll capture and summary`

### Task 7 - Basic Reports + CSV Export
Purpose:
- Deliver minimum reporting utility for operations and finance review.

Touched files:
- New:
  - `app/(admin)/dashboard/reports/page.tsx`
  - `app/actions/exportReport.ts`
  - `app/actions/getDashboardKpis.ts` (extend if needed)

Acceptance criteria:
- Report view displays key totals for selected date range.
- CSV export reflects current filters and matches visible totals.
- Export errors return actionable messages.

Tests to add/adjust:
- `app/actions/exportReport.test.ts` (new)
- report aggregate snapshot tests (new)

Suggested commit:
- `feat(reports): add baseline operational-financial report with csv export`

## QA Notes For Phase 1
Run at minimum:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

Manual sanity:
- Unauthenticated `/dashboard/**` redirects to `/login`.
- New internal order appears in list and calendar.
- Status updates follow transition constraints.
- Expense and payroll entries affect KPI/report totals as expected.
- Public calculator order path remains unchanged.
