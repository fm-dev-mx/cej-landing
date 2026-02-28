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
| Dashboard page shell | Partial | `app/(admin)/dashboard/page.tsx`, `app/(admin)/dashboard/page.module.scss` | Has greeting and orders section, no KPI cards yet. |
| Orders list UI | Partial | `app/(admin)/dashboard/OrdersList.tsx`, `app/(admin)/dashboard/OrdersList.module.scss` | Supports status labels and load-more pagination. |
| Orders query action | Partial | `app/actions/getMyOrders.ts` | Reads from `orders` table with cursor pagination and RBAC `orders:view`. |
| Internal order capture screen | Partial | `app/(admin)/dashboard/new/page.tsx`, `app/(admin)/dashboard/new/AdminOrderForm.tsx` | Basic form exists. |
| Internal order create action | Partial / Risk | `app/actions/createAdminOrder.ts`, `app/actions/createAdminOrder.test.ts` | Inserts into `leads`, not `orders`; conflicts with listing source. |
| Dashboard KPI cards (operational + financial) | No | N/A | Missing. |
| Orders calendar (day/week slots) | No | N/A | Missing route, UI, and server action. |
| Orders list filters (status/date/search) | No | N/A | Missing server-side filter action and UI controls. |
| Order status update action | No | N/A | No explicit controlled transition action found. |
| Expenses capture module | No | N/A | Missing route, type/schema, action, persistence path. |
| Payroll capture module (basic) | No | N/A | Missing route, type/schema, action, persistence path. |
| Basic reports and export | No | N/A | Missing reports route and export action. |
| Attribution fields in internal orders | Partial (public only) | `app/actions/submitLead.ts`, `lib/tracking/**`, `proxy.ts` | Attribution exists in lead pipeline; not normalized for internal order analytics. |
| Pricing engine reusable for internal capture | Yes | `lib/pricing.ts`, `lib/schemas/pricing.ts`, `app/actions/getPriceConfig.ts` | Strong reusable foundation. |
| Public capture flow reusable pieces | Yes | `hooks/useCheckoutUI.ts`, `lib/logic/orderDispatcher.ts`, `components/Calculator/modals/SchedulingModal.tsx` | Can be adapted with internal side-effect isolation. |
| Internal store slice base | Partial | `store/admin/useAdminStore.ts`, `store/slices/ordersSlice.ts` | Store slice exists but not integrated as full internal app state strategy. |
| DB docs for core tables | Yes | `docs/schema.sql`, `docs/DB_SCHEMA.md` | Tables documented (`orders`, `profiles`, `leads`, `price_config`). |
| Database TS type coverage for internal modules | Partial | `types/database.ts` | Strong for `leads`; limited/absent for `orders`, `expenses`, `payroll` typed access. |

## Key Findings By Domain

### Auth and Role Control
- Authentication boundary is present at both proxy and server layout levels.
- RBAC helpers exist and are already used in server actions.
- Duplicate login route (`app/auth/login`) should be normalized to one canonical entrypoint.

### Dashboard / KPIs
- Dashboard exists but is currently order-history oriented.
- There is no operational/financial KPI model or action endpoint.

### Order Capture
- Internal form and action exist.
- Capture persistence is misaligned with dashboard reads (`leads` write vs `orders` read).

### Calendar
- No calendar route or slot model exists.

### Orders List and Status Updates
- Existing list is paginated but lacks filter controls and status transition workflow.

### Expenses and Payroll
- No implementation found in routes, actions, schemas, or DB type contracts.

### Reports and Export
- No report page, aggregate action, or CSV export endpoint found.

### Attribution
- Attribution data exists in public lead/tracking stack, but not normalized for internal order-level reporting.

## Duplicates, Dead Code, Partial Implementations, Risks

### Duplicates
- Dual login routes:
  - `app/(public)/login/page.tsx`
  - `app/auth/login/page.tsx`

### Partial Implementations
- Dashboard route set and list exist but not full internal operations module.
- Admin order capture exists but writes to `leads` with placeholder financial values.

### Dead / Transitional Artifacts
- `store/useCejStore.ts` is explicitly deprecated bridge to `store/public/usePublicStore.ts`.

### High Risks
- **Critical consistency risk:** `createAdminOrder` inserts `leads`, while dashboard list queries `orders`.
- Missing explicit status transition guardrail invites state drift if implemented ad hoc later.
- Data contract gaps in `types/database.ts` increase risk of unsafe persistence changes for new modules.

## Assumptions Recorded
- Context7 MCP is unavailable in this session; repository evidence is used as temporary source of truth.
- Business-rule and schema constraints must be rechecked with Context7 when available before architecture-sensitive implementation starts.
