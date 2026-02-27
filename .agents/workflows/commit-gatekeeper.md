---
description: Semantic commit gatekeeper focusing on ADU splitting based on a preflight report.
---

# `COMMIT_GATEKEEPER` (One-Shot Report-Driven)

## Core Objective

Use one compact report to decide a deterministic route, then propose ADU commits only when static quality gates allow it.

## Execution Steps

1. **Information Retrieval (Atomic):**
   - Run `npx tsx scripts/gatekeeper-report.ts --format json`.
   - Prefer `.git/.gatekeeper/precommit-report.json` when signature matches the current staged index.
   - Run `git diff --cached` only if route is `proceed_adu`.

2. **Analysis Process:**
   - **Step A: Route Decision (Fail-Fast).**
     - If `route=auto_fix`: trigger `/auto-fix`.
     - If `route=architectural_intervention`: stop and request architectural remediation (do not trigger `/auto-fix`).
     - If `route=proceed_adu`: continue to ADU split analysis.
   - **Step B: ADU Strategy.**
     - Use `adu.suggestedSplits` and domain groups from the report as baseline.
     - Confirm split with one read of `git diff --cached`.
     - Group related changes in one unit and isolate unrelated changes.

3. **Commit Proposal (English):**
   - Respond with the precise `git commit` commands using multiple `-m` flags for `pwsh` compatibility.
   - *Standard:* `type(scope): subject` (all lowercase subject).

## Fail-Fast Matrix

| Route | Action | Manual fixes allowed? |
|---|---|---|
| `auto_fix` | Hand off to `/auto-fix` | No |
| `architectural_intervention` | Stop and request architecture-level fix | No |
| `proceed_adu` | Continue with ADU proposal | N/A |

## Success Criteria

- [x] Route is decided from one report call.
- [x] No infinite loop between gatekeeper and `/auto-fix`.
- [x] Commit splitting aligns with the ADU principle.
- [x] Minimum token overhead with compact summary and JSON contract.
