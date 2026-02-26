---
description: Automatically diagnose, fix, and verify linting, formatting, or test failures that block the CI pipeline or pre-commit hooks.
---

# `AUTO_FIX` Workflow

## Trigger

Use this workflow when CI fails, pre-commit hooks block a push, or when requested to "fix linting errors" or "fix test failures."

## Inputs

- Failing command and raw error output
- Changed file list (staged or branch diff)
- Relevant config files (`package.json`, ESLint, Vitest, TypeScript)

## Execution Steps

1. **Isolate the Failure:**
   - Run `pnpm exec lint-staged` (if fixing pre-commit) or `pnpm run lint` and `pnpm test` (if fixing general CI).
   - Analyze the exact output. Identify if the failure is:
     - **Formatting:** (Prettier/ESLint auto-fixable)
     - **Typing:** (TypeScript errors)
     - **Logic/Tests:** (Vitest assertion failures)

2. **Apply Targeted Fixes:**
   - **For Formatting/Linting:** Modify the code strictly to satisfy the rule without altering business logic. If an ESLint rule is consistently problematic or conflicting with Prettier, consult the configuration, but prefer fixing the code first.
   - **For Typing (`tsc`):** Resolve the type error (e.g., narrow types, fix interface mismatches). Never arbitrarily use `any` or `@ts-ignore` to silence the error.
   - **For Tests (`vitest`):** Update the test to match the new component behavior, or fix the component to satisfy the expected test condition.

3. **Local Re-verification:**
   - Run the specific command that failed initially (e.g., `pnpm test components/Calculator/modals/LeadFormModal.test.tsx`).
   - Only proceed when the output is clean.

4. **Architectural Integrity Check:**
   - Ensure the fix did not violate Next.js App Router paradigms (e.g., inappropriately adding `'use client'` to silence a server hook error).
   - Ensure the fix adheres to the project's styling boundaries.

5. **Report the Resolution:**
   - Provide a concise summary of what caused the failure and exactly how it was remedied.

## Success Criteria

- The originally failing command passes with exit code `0`.
- No new lint, type, or test regressions are introduced in changed files.
- The fix remains within project architecture constraints (no bypasses like `any` or `@ts-ignore`).

## Failure Handling

- If failure classification is unclear, rerun only the failing command with verbose output and reclassify.
- If a fix would change product behavior, stop and ask for explicit approval before proceeding.
- If environment-specific issues block execution, report the exact command and blocker, then provide the minimal manual fallback.
