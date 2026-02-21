---
description: Perform a code review for a Pull Request
---

# Code Review Workflow

## Trigger

Use this workflow when requested to review a pull request or branch before merge.

## Inputs

- PR diff or branch diff
- Related tests and changed files
- Project conventions in `.agents/workflows/PROJECT_CONVENTIONS.md`

## Execution Steps

1. Check out the branch locally.
2. Review the code changes line by line. Ensure there are no inline styles. Ensure code variables, functions, and commit messages are in English. Text visible strictly to the final user should be in Spanish.
3. Run `pnpm test` to verify no regressions were introduced.
4. Provide a structured review summary evaluating direct impacts, potential side effects, and production readiness.

## Success Criteria

- Findings are prioritized by severity and tied to exact file paths.
- Review verifies architecture and language conventions.
- Test verification result is documented with pass/fail status.

## Failure Handling

- If tests cannot run, report why and mark residual risk explicitly.
- If diff context is incomplete, stop and request the missing branch or PR reference.
