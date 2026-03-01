# Database Integrity Audit

## 1. Purpose

This document audits the current Supabase physical schema against project documentation and TypeScript database contracts, then defines governance controls to prevent future drift.

## 2. Scope

- Physical schema source: `docs/schema.sql`
- Type contracts: `types/database.ts`, `types/database-enums.ts`
- Existing architecture/docs baseline: `docs/DB_SCHEMA.md`, `docs/ARCHITECTURE.md`
- Audit date: 2026-03-01

## 3. Method

1. Enumerate all `CREATE TABLE` definitions from `docs/schema.sql`.
2. Enumerate all `Database.public.Tables` entries in `types/database.ts`.
3. Compare enum values between SQL enum types and `types/database-enums.ts`.
4. Compare foreign key relationships from SQL `REFERENCES` clauses against TS `Relationships` metadata.
5. Review RLS enablement and explicit policy declarations.
6. Identify documentation drift against real schema.

## 4. Physical Schema Inventory vs Type Contracts

| Table | SQL Exists | TS Table Exists | Primary Key | FK Count (SQL) | RLS Enabled | Explicit Policies | Drift Status |
|---|---|---|---|---:|---|---|---|
| `profiles` | Yes | Yes | `id` | 1 (`auth.users`) | Yes | None | Partial drift |
| `leads` | Yes | Yes | `id` | 0 | Yes | None | Partial drift |
| `service_slots` | Yes | Yes | `slot_code` | 0 | Yes | None | Aligned |
| `orders` | Yes | Yes | `id` | 5 | Yes | None | Partial drift |
| `order_payments` | Yes | Yes | `id` | 2 | Yes | None | Partial drift |
| `order_status_history` | Yes | Yes | `id` | 2 | Yes | None | Partial drift |
| `order_fiscal_data` | Yes | Yes | `order_id` | 1 | Yes | None | Partial drift |
| `price_config` | Yes | Yes | `id` | 0 | Yes | `Public read prices` | Aligned |
| `expenses` | Yes | Yes | `id` | 1 | Yes | None | Partial drift |
| `payroll` | Yes | Yes | `id` | 1 | Yes | None | Partial drift |

Notes:

- Table count parity exists: 10 SQL tables and 10 TS tables.
- `types/database.ts` currently declares `Relationships: []` for all tables, which does not reflect SQL foreign key topology.

## 5. Enum Alignment

### 5.1 SQL Enum Types

- `order_status_enum`
- `payment_status_enum`
- `fiscal_status_enum`
- `payment_direction_enum`
- `payment_kind_enum`
- `payment_method_enum`
- `lead_status_enum`

### 5.2 TS Enum Type Aliases

`types/database-enums.ts` defines:

- `DbOrderStatus`
- `DbPaymentStatus`
- `DbFiscalStatus`
- `DbPaymentDirection`
- `DbPaymentKind`
- `DbPaymentMethod`
- `DbLeadStatus`

Status: enum value sets are aligned with `docs/schema.sql`.

## 6. Integrity and Governance Findings

## P0 Findings

1. **Foreign key metadata drift in TS contracts**
   - SQL has 13 foreign key references.
   - `types/database.ts` uses `Relationships: []` for every table.
   - Impact: weak join typing guarantees, reduced contract fidelity, higher risk during query evolution.

## P1 Findings

1. **RLS policy declarations are under-specified in schema-as-code**
   - All tables enable RLS, but explicit policies are only declared for `price_config`.
   - "Service role only" appears in comments but is not codified as policy artifacts in SQL.
   - Impact: operator ambiguity and harder auditability of access model.
2. **Documentation drift in `docs/DB_SCHEMA.md`**
   - Contains simplified/legacy table descriptions that no longer represent actual columns and relationships from `docs/schema.sql`.
   - Impact: onboarding friction and potential implementation decisions from stale docs.

## P2 Findings

1. **Schema lifecycle process not formalized**
   - No documented, enforced pipeline that guarantees schema and type contracts evolve together.
   - Impact: recurring drift risk over time.

## 7. Canonical Rules (Database Governance)

1. `docs/schema.sql` is the physical schema source of truth for this repository.
2. `types/database.ts` and `types/database-enums.ts` are generated/derived contracts and must remain parity-aligned with schema columns, enums, nullability, defaults, and relationships.
3. RLS governance must be represented as executable SQL policies, not comments alone.
4. Documentation files (`docs/DB_SCHEMA.md`) are descriptive and must never supersede schema-as-code.

## 8. Required Controls

1. **Schema-Type Drift Gate**
   - Add a CI check that compares SQL table/enum/relationship signatures with TS contracts.
   - Fail on mismatch for changed schemas or changed TS DB contracts.
2. **Relationship Fidelity Rule**
   - `Relationships` arrays in `types/database.ts` must reflect SQL FKs.
3. **RLS Policy Completeness Rule**
   - Every RLS-enabled table must have explicit policy declaration(s) or explicit deny-by-design policy documentation artifact.
4. **Documentation Sync Rule**
   - Changes to `docs/schema.sql` require a corresponding `docs/DB_SCHEMA.md` update in same PR.

## 9. Evidence References

- `docs/schema.sql`
- `types/database.ts`
- `types/database-enums.ts`
- `docs/DB_SCHEMA.md`
