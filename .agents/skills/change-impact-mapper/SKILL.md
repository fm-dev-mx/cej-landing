---
name: Change Impact Mapper
description: Map changed files to the minimum verification command set (lint, typecheck, related tests, full tests) with explicit risk rules. Use when selecting fast but safe local validation steps.
---

# Change Impact Mapper

## Trigger

Use when asked what to run locally before commit/push, or when trying to avoid unnecessary full-suite runs.

## Inputs

- Changed file list (`staged` or branch diff)
- Current scripts from `package.json`
- Risk indicators (config, shared libs, core logic, tests)

## Execution Steps

1. Classify changed files:
   - UI/component-only
   - Domain logic/lib
   - Test-only
   - Tooling/config/hook files
2. Build minimum command set:
   - UI/component-only: lint-staged or eslint + related tests
   - Domain logic/lib: add `pnpm exec tsc --noEmit` and related tests
   - Tooling/config/hook: add targeted command for affected tool
3. Escalate to full `pnpm test` only when risk is high:
   - Shared library change
   - Broad refactor across domains
   - Failing related tests with unclear blast radius
4. Return a clear ordered command list and rationale for each command.

## Success Criteria

- Validation plan is minimal but covers likely regression surface.
- Every recommended command maps to a concrete risk from changed files.
- Full-suite runs are recommended only when justified by explicit risk rules.

## Failure Handling

- If changed scope cannot be inferred, default to `pnpm exec tsc --noEmit` plus `pnpm test`.
- If a recommended command is unavailable, provide the closest equivalent in current scripts.
