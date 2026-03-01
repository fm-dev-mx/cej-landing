# 00 - Audit: Existing vs Missing Internal MVP Surface

## Audit Basis
Evidence was gathered from repository inspection with `rg`, `Get-ChildItem`, and `Get-Content`.
No production code was modified during this audit.

## Mapping Table: Screen/Feature Inventory

| Screen / Feature | Exists? | File Paths | Notes |
| --- | --- | --- | --- |
| Login screen (public route) | Partial | `app/(public)/login/page.tsx`, `components/Auth/LoginForm.tsx` | Active Magic Link flow exists. |
| Login screen (secondary duplicate route) | Partial / Duplicate | `app/auth/login/page.tsx` | Duplicate entrypoint; creates ambiguity. |
| Auth callback | Yes | `app/auth/callback/route.ts` | Exchanges auth code and redirects to `/dashboard` or `redirect` query. |
| Dashboard route protection (edge/proxy) | Yes | `proxy.ts`, `proxy.test.ts` | `/dashboard/**` protected, unauthenticated users redirected to `/login?redirect=...`. |
| Dashboard route protection (server layout) | Yes | `app/(admin)/dashboard/layout.tsx` | Secondary server-side auth guard. |
| RBAC utility | Yes | `lib/auth/rbac.ts`, `lib/auth/rbac.test.ts` | Role + permission matrix (`owner/admin/operator`) exists. |
| Dashboard page shell | ✅ Complete | `app/(admin)/dashboard/page.tsx`, `app/(admin)/dashboard/page.module.scss` | Has greeting, KPI cards, and orders section. |
| Orders list UI | ✅ Complete | `app/(admin)/dashboard/OrdersList.tsx`, `app/(admin)/dashboard/orders/page.tsx` | Supports status labels, filters, and pagination. |
| Orders query action | ✅ Complete | `app/actions/listOrders.ts`, `app/actions/getMyOrders.ts` | Supports filters and cursor pagination with RBAC. |
| Internal order capture screen | ✅ Complete | `app/(admin)/dashboard/new/page.tsx`, `app/(admin)/dashboard/new/AdminOrderForm.tsx` | Form exists and persists to `orders` table. |
| Internal order create action | ✅ Complete | `app/actions/createAdminOrder.ts`, `app/actions/createAdminOrder.test.ts` | Now inserts into `orders` table (fixed from audit). |
| Dashboard KPI cards (operational + financial) | ✅ Complete | `app/actions/getDashboardKpis.ts` | Returns totalOrders, scheduledToday, pendingOrders, revenueTotal. |
| Orders calendar (day/week slots) | ✅ Complete | `app/(admin)/dashboard/calendar/page.tsx` | Week view with order grouping by delivery date. |
| Orders list filters (status/date/search) | ✅ Complete | `app/actions/listOrders.ts`, `app/(admin)/dashboard/orders/page.tsx` | Server-side filters + UI form. |
| Order status update action | ✅ Complete | `app/actions/updateOrderStatus.ts`, `lib/schemas/internal/order-status.ts` | Controlled transition matrix enforced on backend. |
| Expenses capture module | ⚠️ Partial | `app/actions/createExpense.ts`, `app/actions/listExpenses.ts`, `app/(admin)/dashboard/expenses/page.tsx` | Actions exist; page has list but NO create form UI. |
| Payroll capture module (basic) | ⚠️ Partial | `app/actions/createPayrollEntry.ts`, `app/actions/listPayrollEntries.ts`, `app/(admin)/dashboard/payroll/page.tsx` | Actions exist; page has list but NO create form UI. |
| Basic reports and export | ✅ Complete | `app/(admin)/dashboard/reports/page.tsx`, `app/actions/exportReport.ts` | Date range selection with CSV export including balance. |
| Attribution fields in internal orders | Partial (public only) | `app/actions/submitLead.ts`, `lib/tracking/**`, `proxy.ts` | Attribution exists in lead pipeline; not normalized for internal order analytics. |
| Pricing engine reusable for internal capture | Yes | `lib/pricing.ts`, `lib/schemas/pricing.ts`, `app/actions/getPriceConfig.ts` | Strong reusable foundation. |
| Public capture flow reusable pieces | Yes | `hooks/useCheckoutUI.ts`, `lib/logic/orderDispatcher.ts`, `components/Calculator/modals/SchedulingModal.tsx` | Can be adapted with internal side-effect isolation. |
| Internal store slice base | Partial | `store/admin/useAdminStore.ts`, `store/slices/ordersSlice.ts` | Store slice exists but not integrated as full internal app state strategy. |
| DB docs for core tables | Yes | `docs/schema.sql`, `docs/DB_SCHEMA.md` | Tables documented (`orders`, `profiles`, `leads`, `price_config`). |
| Database TS type coverage for internal modules | Partial | `types/database.ts`, `types/internal/*.ts` | Types exist for orders, financials, reporting. |

## Key Findings By Domain

### Auth and Role Control
- Authentication boundary is present at both proxy and server layout levels.
- RBAC helpers exist and are already used in server actions.
- **Still open:** Duplicate login routes (`app/auth/login` vs `app/(public)/login`) should be normalized.

### Dashboard / KPIs
- Dashboard exists with KPI cards (totalOrders, scheduledToday, pendingOrders, revenueTotal).
- KPI query supports current_week and current_month periods.

### Order Capture
- Internal form exists and correctly writes to `orders` table (FIXED from audit).
- Status and financial fields are persisted consistently.

### Calendar
- Calendar route exists at `/dashboard/calendar` with week view.
- Orders grouped by delivery date/time.

### Orders List and Status Updates
- List has server-side filters and UI controls.
- Status transition action with controlled matrix implemented.

### Expenses and Payroll
- Actions exist for create and list.
- **Gap:** Pages display lists but lack create forms.

### Reports and Export
- Report page exists with date range selection.
- CSV export works with summary totals including balance calculation.

### Attribution
- Attribution data exists in public lead/tracking stack, but not normalized for internal order-level reporting.

## Duplicates, Dead Code, Partial Implementations, Risks

### Duplicates
- **Still open:** Dual login routes:
  - `app/(public)/login/page.tsx`
  - `app/auth/login/page.tsx`

### Partial Implementations
- Expenses: Actions exist, page only shows list - no create form.
- Payroll: Actions exist, page only shows list - no create form.

### Dead / Transitional Artifacts
- `store/useCejStore.ts` is explicitly deprecated bridge to `store/public/usePublicStore.ts`.

### High Risks (RESOLVED)
- **✅ RESOLVED:** `createAdminOrder` now inserts into `orders` table (was `leads`).
- ✅ Status transition guardrail implemented via `canTransition` in schema.
- ✅ Database types added for internal modules (`types/internal/*`).

## Assumptions Recorded
- Context7 MCP is unavailable in this session; repository evidence is used as temporary source of truth.
- Business-rule and schema constraints must be rechecked with Context7 when available before architecture-sensitive implementation starts.
