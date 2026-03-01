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
- **Current implementation: 74%** (updated after codebase verification)
- **Target after Phase 1: 74%**

Verification summary (2025-02-28):
- ✅ Order persistence aligned (createAdminOrder writes to `orders` table)
- ✅ Dashboard KPIs implemented (getDashboardKpis.ts + page.tsx)
- ✅ Calendar implemented (calendar/page.tsx - week view)
- ✅ Orders list with filters (listOrders.ts + orders/page.tsx)
- ✅ Status transitions implemented (updateOrderStatus.ts with guardrails)
- ✅ Expenses actions exist (createExpense, listExpenses)
- ⚠️ Expenses page has list but NO create form UI
- ✅ Payroll actions exist (createPayrollEntry, listPayrollEntries)
- ⚠️ Payroll page has list but NO create form UI
- ✅ Reports + CSV export implemented (exportReport.ts + reports/page.tsx)

## Ordered Tasks

### Task 1 - Unify Internal Order Persistence Path
**Status: ✅ COMPLETED**

Purpose:
- Remove operational mismatch by making internal creation and listing use the same source (`orders`-centric path).

Actual implementation:
- `app/actions/createAdminOrder.ts` now inserts into `orders` table (was fixed from audit)
- Status and financial fields persisted consistently
- No regression in public `submitLead` pipeline

### Task 2 - Dashboard KPI v1
**Status: ✅ COMPLETED**

Purpose:
- Add operational and financial summary cards for fast daily visibility.

Actual implementation:
- `app/actions/getDashboardKpis.ts` returns: totalOrders, scheduledToday, pendingOrders, revenueTotal
- Dashboard page displays KPI cards with current_month period

### Task 3 - Calendar v1 (Day/Week)
**Status: ✅ COMPLETED**

Purpose:
- Provide dispatch/operations visibility by delivery date and slot.

Actual implementation:
- `app/(admin)/dashboard/calendar/page.tsx` displays week view
- Uses `listOrders` action with date range filtering
- Shows orders grouped by delivery date with time and volume

### Task 4 - Orders List Filters + Status Transition Flow
**Status: ✅ COMPLETED**

Purpose:
- Convert current list into operational queue with controlled status updates.

Actual implementation:
- `app/actions/listOrders.ts` supports: status, date range (startDate/endDate), folio search
- `app/(admin)/dashboard/orders/page.tsx` has filter form and table display
- `app/actions/updateOrderStatus.ts` with controlled transition matrix via `canTransition`
- `lib/schemas/internal/order-status.ts` defines transition rules

### Task 5 - Expenses Capture v1
**Status: ⚠️ PARTIAL - Missing create form UI**

Purpose:
- Record basic operational expenses to support KPI and reporting.

Actual implementation:
- `app/actions/createExpense.ts` - action exists
- `app/actions/listExpenses.ts` - action exists  
- `app/(admin)/dashboard/expenses/page.tsx` - has LIST only, NO create form
- `lib/schemas/internal/financials.ts` - schema exists
- `types/internal/financials.ts` - types exist

**Gap:** Page displays expense list but has no form for creating new expenses.

### Task 6 - Payroll Capture v1 (Basic)
**Status: ⚠️ PARTIAL - Missing create form UI**

Purpose:
- Capture payroll entries at basic operational level for reporting.

Actual implementation:
- `app/actions/createPayrollEntry.ts` - action exists
- `app/actions/listPayrollEntries.ts` - action exists
- `app/(admin)/dashboard/payroll/page.tsx` - has LIST only, NO create form
- `lib/schemas/internal/financials.ts` - schema exists
- `types/internal/financials.ts` - types exist

**Gap:** Page displays payroll list but has no form for creating new entries.

### Task 7 - Basic Reports + CSV Export
**Status: ✅ COMPLETED**

Purpose:
- Deliver minimum reporting utility for operations and finance review.

Actual implementation:
- `app/(admin)/dashboard/reports/page.tsx` with date range form
- `app/actions/exportReport.ts` aggregates orders + expenses + payroll
- CSV export includes line items + summary totals with balance calculation

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
