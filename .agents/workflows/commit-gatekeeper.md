---
description: Semantic commit gatekeeper focusing on ADU splitting based on a preflight report.
---

# `COMMIT_GATEKEEPER` (Report-Driven)

## Core Objective

Analyze the **Preflight Report** and **Staged Diff** to enforce **ADU (Atomic, Descriptive, Useful)** splitting. Minimize procedural tool calls.

## Execution Steps

1. **Information Retrieval (Atomic):**
   - Run `npx tsx scripts/gatekeeper-report.ts` to get the status of all static checks.
   - Run `git diff --cached` ONLY ONCE to get the full semantic context.

2. **Analysis Process:**
   - **Step A: Check Quality.** If the Preflight Report shows ❌ FAIL, immediately stop and trigger `/auto-fix` to resolve static errors.
   - **Step B: ADU Strategy.** If quality is ✅ PASS, analyze the diff to determine the logical split.
     - Group related changes into a single unit.
     - Isolate unrelated fixes, features, or refactors.

3. **Commit Proposal (English):**
   - Respond with the precise `git commit` commands using multiple `-m` flags for `pwsh` compatibility.
   - *Standard:* `type(scope): subject` (all lowercase subject).

## REMINDER: Fail-Fast

Do NOT attempt to fix hygiene or linting manually. If the report says FAIL, the Gatekeeper's only job is to hand off to `/auto-fix`.

## Success Criteria

- [x] Zero tool calls for individual hygiene/lint checks.
- [x] Commit splitting aligns with the ADU principle.
- [x] Minimum token overhead for procedural diagnostics.
