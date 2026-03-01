# Architectural Patterns Canonicalization

## 1. Purpose

Formalize the canonical architecture for `cej-landing` so future implementation work follows explicit and enforceable structural patterns.

## 2. Observed Current Architecture

1. Framework baseline: Next.js App Router with route groups and server-first rendering.
2. Mutation boundary: Server Actions under `app/actions/*`.
3. Data layer: Supabase clients for user-context and admin-context access.
4. Validation layer: Zod schemas in `lib/schemas/*`.
5. Domain/services: partial orchestration in `lib/logic/*`.
6. Presentation: component composition with SCSS modules.

## 3. Canonical Pattern Set (Required)

### 3.1 App Router Boundary Pattern

1. Server Components are default.
2. Client Components only for interactivity/browser APIs.
3. Route handlers and actions are transport boundaries, not business-rule sinks.

### 3.2 Action Pipeline Pattern

Every mutation action must follow this sequence:

1. Authentication check.
2. Authorization (RBAC) check.
3. Runtime schema validation (Zod).
4. Domain orchestration call (`lib/logic/*` or `lib/services/*`).
5. Persistence call with typed DB contract.
6. Deterministic typed result mapping (`*Result` union).
7. Monitoring/reporting at failure boundaries.

### 3.3 Data Access Pattern (Supabase)

1. `createClient` for RLS-constrained user context.
2. `createAdminClient` only after explicit RBAC pass and only in server-only code.
3. No ad-hoc direct `@supabase/supabase-js` client creation inside feature actions except documented infrastructure entrypoints.
4. No `as any` coercion around Supabase calls in production code.

### 3.4 Contract Segregation Pattern

1. DB row/insert/update contracts belong in `types/database.ts`.
2. Domain contracts belong in `types/domain*` and `types/internal/*`.
3. Action payload/result contracts are named and exported from action module or colocated contract file.
4. Mapping between DB contracts and domain contracts must be explicit.

### 3.5 Domain Service Pattern

1. Business logic with branching or transformations belongs in `lib/logic/*`.
2. Server Actions should remain thin orchestrators and not embed complex business computation.
3. Shared pure calculations belong in dedicated pure modules (example: pricing utilities).

## 4. Canonical Folder and Ownership Model

1. `app/**`: routing, layouts, actions, route handlers.
2. `lib/supabase/**`: all Supabase client factories and infra integration.
3. `lib/schemas/**`: runtime validation schemas.
4. `lib/logic/**`: domain orchestration and business process utilities.
5. `types/**`: shared contracts only.
6. `components/**`: UI composition and rendering concerns.
7. `store/**`: client state contracts and persistence boundaries.

## 5. Prohibited Architectural Anti-Patterns

1. Fat Server Actions that mix auth, validation, pricing, persistence, and formatting without separation.
2. Direct DB access from client components.
3. `as any` around query builders in production code.
4. Defining business invariants in UI-only layers.
5. Recreating transport clients ad hoc in feature modules when canonical factories exist.

## 6. Architecture Decision Rules

1. New cross-domain behavior requires a documented contract in `types/**` or colocated module exports.
2. New DB fields require synchronized updates to:
   - `docs/schema.sql`
   - `types/database.ts`
   - affected Zod schemas
   - action/domain mappings
3. New privileged mutations must include RBAC guard and explicit admin-client justification.

## 7. Governance Quality Gates

1. Lint and typecheck must pass on all PRs.
2. Action modules must satisfy pipeline checklist (auth, RBAC, validation, typed result).
3. Architecture-sensitive changes require schema/type/doc parity evidence in PR description.

## 8. Acceptance Criteria

1. All new actions conform to canonical pipeline pattern.
2. No production-layer `as any` on Supabase clients.
3. Domain logic is testable outside transport and framework boundaries.
4. Architecture docs remain aligned with implemented folder boundaries and action flow.

## 9. Evidence References

- `docs/ARCHITECTURE.md`
- `app/actions/*.ts`
- `lib/supabase/server.ts`
- `lib/logic/*`
- `types/*`
