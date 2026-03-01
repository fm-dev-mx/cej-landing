# Compliance Roadmap

## 1. Purpose

Provide an actionable path to bring `cej-landing` into full compliance with the architecture and type governance standards defined in this audit package.

## 2. Enforcement Mode

Selected default: **Phased Gates**.

Enforcement Mode: **Hard Enforcement (Blocking CI)**.

Rationale:

- All governance scripts are now wired into `.github/workflows/ci.yml`.
- All baseline tests have been satisfied.
- No new debt is allowed in production paths.

## 3. Baseline Compliance Snapshot (2026-03-01)

1. DB schema and TS table coverage: aligned by table count.
2. DB relationship metadata: not aligned (`Relationships: []` everywhere).
3. RLS enablement: present for all tables.
4. Explicit SQL policies: minimal in schema file (mainly `price_config` public read).
5. Production type debt: `as any` usage in critical server actions.
6. Documentation drift: `docs/DB_SCHEMA.md` not fully aligned with canonical SQL.

## 4. Governance KPIs

1. `production_any_count`: count of `any`/`as any` in `app/**`, `lib/**`, `components/**`, `store/**`.
2. `db_contract_drift_count`: schema/type mismatches detected by drift check script.
3. `action_pipeline_compliance_rate`: percentage of actions passing checklist.
4. `doc_schema_sync_sla`: PRs with schema changes that include required doc/type updates.

## 5. Phased Execution Plan

## Phase 0: Baseline and Instrumentation (Week 1) [COMPLETED 2026-03-01]

Goals:

1. Freeze and publish governance baselines.
2. Create machine-checkable compliance scripts.

Actions:

1. Add script to validate SQL tables/enums/FKs vs `types/database.ts`. [DONE]
2. Add script to detect exported inline object signatures. [DONE]
3. Add script/report for production `any` count. [DONE]
4. Publish PR checklist template for architecture-sensitive changes. [DONE]
5. Add script to check Action Pipeline compliance. [DONE]

Exit Criteria:

1. Baseline metrics generated in CI artifacts. [DONE]
2. Scripts run in CI in fail mode (Blocking). [DONE]

## Phase 1: Guard New and Changed Code (Weeks 2-3) [ENFORCED]

Goals:

1. Stop introducing new governance debt.
2. Keep legacy debt visible but not yet blocking globally.

Actions:

1. Fail CI on new production `any` in changed files. [DONE - Global fail enabled]
2. Fail CI on new exported inline signature violations in changed files. [DONE - Global fail enabled]
3. Require schema-type-doc parity for PRs touching `docs/schema.sql` or `types/database.ts`. [DONE]
4. Enforce action pipeline checklist for modified `app/actions/*`. [DONE]

Exit Criteria:

1. Zero new debt from merged PRs in scoped checks.
2. All changed action files pass pipeline checklist.

## Phase 2: Remediate High-Risk Legacy Debt (Weeks 4-6)

Goals:

1. Remove highest-risk legacy type and contract drift.
2. Increase strictness across broader code surface.

Actions:

1. Eliminate production `as any` from prioritized server actions.
2. Populate `Relationships` metadata in DB contracts to match SQL FKs.
3. Update stale schema documentation to reflect canonical SQL.
4. Convert report-only drift checks to fail mode for core paths.

Exit Criteria:

1. `production_any_count` reduced to agreed threshold (target: 0 in server action layer).
2. `db_contract_drift_count` = 0 for core DB files.

## Phase 3: Full Hard Enforcement (Week 7+)

Goals:

1. Enforce governance repo-wide as default quality bar.

Actions:

1. Enable global fail on production `any`.
2. Enable global fail on exported inline signature violations.
3. Require successful schema/type drift check on every PR.
4. Add release gate requiring all governance checks pass.

Exit Criteria:

1. All governance checks are blocking and green.
2. No approved exceptions older than defined SLA.

## 6. Validation Strategy and Tooling

### 6.1 Required Commands

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`

### 6.2 Additional Governance Gates (to add)

1. `pnpm governance:check-db-contracts`
2. `pnpm governance:check-inline-types`
3. `pnpm governance:check-production-any`
4. `pnpm governance:check-action-pipeline`

### 6.3 PR Policy

1. Any architecture-sensitive change must include:
   - impact summary
   - affected contracts
   - governance checks output
2. Any exception must include:
   - reason
   - owner
   - expiration date

## 7. Risk Register

1. **Risk:** CI friction from strict checks too early.
   - **Mitigation:** phased mode and changed-file gating first.
2. **Risk:** Hidden drift from manual DB type maintenance.
   - **Mitigation:** drift script + mandatory parity checks.
3. **Risk:** Legacy docs continue diverging.
   - **Mitigation:** schema-doc sync gate tied to SQL changes.

## 8. Ownership Model

1. Architecture owner: validates action pipeline and folder boundaries.
2. Data owner: validates schema/type parity and RLS policy artifacts.
3. QA owner: validates tests and non-regression of governance scripts.

## 9. Definition of Done (Governance Rollout)

1. Governance scripts exist and run in CI.
2. New debt is blocked in changed scope.
3. Legacy high-risk debt remediated.
4. Hard enforcement is active repo-wide.

## 10. Evidence References

- `.agents/plans/system-governance-audit/01-database-integrity-audit.md`
- `.agents/plans/system-governance-audit/02-type-system-governance.md`
- `.agents/plans/system-governance-audit/03-architectural-patterns.md`
- `docs/schema.sql`
- `types/database.ts`
- `eslint.config.mjs`
- `tsconfig.json`
