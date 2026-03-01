# Amended Governance Rollout (Implemented)

## Scope (P0/P1 in this iteration)

- FK-only drift checks between `docs/schema.sql` and `types/database.ts`.
- Production `any` usage reporting with separate counters.
- Exported inline object signature reporting with canonical allowlist.
- Action pipeline contract enforcement (Auth, RBAC, Validation, Typed result).
- Deterministic governance artifact generation.
- RLS policy completeness + auditability documentation.
- Server action typing refactors to remove production `as any`.

## FK Drift Checker Rules

### Identity and Matching

FK identity is matched only by tuple:

`(table, columns[], referencedRelation, referencedColumns[])`

`foreignKeyName` is metadata only (reported, never used for equality).

### SQL Normalization

- Assume schema `public` when unqualified.
- Normalize `public.orders` as `orders`.
- Best-effort stripping of quoted identifiers for matching.

### SQL Extraction Scope (Intentional Limit)

This checker is intentionally **not** a full SQL parser.
It extracts only:

1. `CREATE TABLE ... REFERENCES ...`
2. `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY (...) REFERENCES ...`

All non-FK statements are ignored for drift purposes.

## CLI Modes

All governance checks are report-only by default (exit `0`).
Use `--fail` to make violations blocking.
All checks are now **BLOCKING** in CI by default.

Supported flags:

- `--fail`
- `--format json|text`
- `--out <path>`

## Metrics

- `db_fk_drift_count`
- `production_any_count`
- `as_any_count`
- `typed_any_count`
- `array_any_count`
- `inline_exported_signature_count`
- `action_pipeline_violation_count`

## Canonical Inline Allowlist Schema

`.governance/inline-types.allowlist.json`

```json
{
  "entries": [
    { "path": "rel/path.tsx", "reason": "..." },
    { "path": "rel/path.ts", "symbol": "ExportedName", "reason": "..." }
  ]
}
```

Rules:

- `path` is exact match.
- `symbol` is optional.
- No globs in this iteration.

## Server Action Refactor Ladder

1. Prefer typed mapping / `.returns<T>()` first.
2. Do not add `.single()` / `.maybeSingle()` unless current behavior already assumes one-row semantics.
3. Introduce named contracts only when required to remove unsafe casts.
4. Any unavoidable exception must be documented inline (reason + TODO + issue tag).

## RLS Framing

Goal is policy completeness and auditability for every RLS-enabled table.
This does not claim stronger protection against service-role access, because service-role bypasses RLS by design.

## Artifact Contract

Default path:

- `.artifacts/governance/initial-governance-report.json`

Required metadata includes:

- `tool_versions` (`node`, `pnpm` best-effort)
- `repo_state` (`branch` best-effort, `dirty` boolean)

