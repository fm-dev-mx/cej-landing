# Type System Governance

## 1. Purpose

Define strict, enforceable standards for TypeScript type/interface usage across `cej-landing`, including a definitive policy for inline type/interface declarations.

## 2. Scope

- `types/**`
- `app/**` server actions and route handlers
- `lib/**` domain and service logic
- `components/**` public component contracts
- `store/**` state contracts
- test files (`*.test.ts`, `*.test.tsx`) with explicit exceptions

## 3. Type Layering Model

### 3.1 Physical Data Contracts

- Location: `types/database.ts`, `types/database-enums.ts`
- Role: mirror Supabase physical schema.
- Rule: no business semantics beyond what schema guarantees.

### 3.2 Domain Contracts

- Location: `types/domain.ts`, `types/order.ts`, `types/quote.ts`, `types/internal/**`
- Role: business-level entities, workflows, and use-case payloads.
- Rule: independent from transport and framework concerns.

### 3.3 Runtime Validation Contracts

- Location: `lib/schemas/**` (Zod)
- Role: runtime validation and parsing boundaries.
- Rule: parser output types must map to named domain contracts where reused.

### 3.4 UI and Action API Contracts

- Colocate types with feature/component/action when not shared.
- Promote to `types/**` only when cross-domain reuse is real and stable.

## 4. Definitive Inline Types/Interfaces Policy

## Decision

Inline types/interfaces are **restricted by default** and **prohibited in exported API signatures**.

## Prohibited

1. Exported function/component signatures using inline object literal types:
   - `export function x(arg: { ... }): { ... }`
2. Repeated anonymous object shapes across a file or across files.
3. Inline complex unions/intersections in public signatures.
4. Anonymous object types for Server Action payload/result contracts.

## Allowed Exceptions

1. Local, one-off callback annotations where extraction reduces clarity.
2. Narrow test-only inline shapes in `*.test.*` files.
3. Internal generic utility constraints that are not exported and remain concise.

## Mandatory Extraction Thresholds

Extract to a named `type` or `interface` when any condition is true:

1. Shape appears more than once in a file.
2. Shape has more than 3 properties in a function/component signature.
3. Signature is exported.
4. Shape crosses module boundaries.

## 5. Rules for `type` vs `interface`

1. Use `interface` for extendable object contracts likely to evolve.
2. Use `type` for unions, mapped/conditional types, and aliases.
3. Do not define both `type X` and `interface X` for the same concept.
4. Name exported contracts with explicit semantics:
   - `*Payload`, `*Result`, `*Row`, `*Insert`, `*Update`, `*Filters`.

## 6. Type Debt Policy

## 6.1 `any` Policy

1. `any` is forbidden in production paths (`app/**`, `lib/**`, `components/**`, `store/**`).
2. Test files may use `any` only when mocking unavoidable third-party generic APIs.
3. Every `any` exception in tests requires an inline rationale comment.

## 6.2 Current Debt Baseline (from repository scan)

1. Production `any` usage exists in server actions:
   - `app/actions/createAdminOrder.ts`
   - `app/actions/createOrderPayment.ts`
   - `app/actions/getDashboardKpis.ts`
   - `app/actions/updateOrderStatus.ts`
   - `app/actions/submitLead.ts`
2. Multiple test files suppress `@typescript-eslint/no-explicit-any` globally.

## 6.3 Redundancy and Naming Drift

1. Database contracts are partially duplicated with legacy-style docs and domain-shaped examples in docs.
2. Contract naming is mostly consistent but not enforced by linting.

## 7. Enforcement Strategy

### 7.1 Lint Rules

1. Keep `@typescript-eslint/no-explicit-any: error` globally.
2. Add scoped override for tests with strict exception comment requirement.
3. Add custom rule (or AST-based check) to fail exported inline object signatures.
4. Add rule to forbid `as any` in production directories.

### 7.2 Typecheck Gates

1. Keep strict `tsconfig.json` with `strict: true`.
2. Add CI gate running `pnpm typecheck` on every PR.

### 7.3 Contract Drift Gates

1. Introduce a check script to compare schema/table/enums with DB type files.
2. Fail PR when drift detected in modified scope.

## 8. Acceptance Criteria

1. No new production `any` or exported inline object signatures.
2. All new public action/component APIs use named payload/result contracts.
3. Test-only `any` usage is documented and minimal.
4. DB contract changes include explicit schema alignment evidence.

## 9. Migration Guidance (Non-Mutating in this Audit Step)

1. Prioritize replacing production `as any` in server actions with typed Supabase query builders.
2. Replace top-level file-wide test disables with local helper types.
3. Introduce reusable query result helper types for common Supabase chains.

## 10. Evidence References

- `types/database.ts`
- `types/database-enums.ts`
- `app/actions/*.ts` (server action layer)
- `eslint.config.mjs`
- `tsconfig.json`
