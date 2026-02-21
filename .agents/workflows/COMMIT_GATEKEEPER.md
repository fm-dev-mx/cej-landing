---
description: Acts as a strict gatekeeper for commits, analyzing staged files, splitting them into atomic units, preventing inline styles/scripts, and enforcing architectural rules.
---

# `COMMIT_GATEKEEPER` Workflow

## Trigger

Use this workflow when the user asks to "prepare commits", "run gatekeeper", or "commit staged changes".

## Inputs

- Current staged diff (`git diff --cached`)
- Current staged files (`git diff --cached --name-only`)
- Commit objective from user prompt

## Execution Steps

1. **Analyze Staged Files:**
   - Run `git diff --cached` to deeply analyze what is currently staged.
   - Do NOT look at unstaged files unless explicitly requested.

2. **Architectural & Quality Verification (The Gatekeeper Limits):**
   - **No Inline Styles:** REJECT any commit that adds inline styles (`style={{...}}`) to React components. Automatically fix them or instruct the user to use SCSS Modules mapped to design tokens.
   - **No Inline Scripts:** REJECT any native `<script>` tags or improperly configured `next/script` that violate Next.js conventions.
   - **Next.js App Router Integrity:** Ensure no `'use client'` directive is unnecessarily placed at layout boundaries or global scopes. Data fetching must remain server-side by default.
   - **Type & Test Sanity:** If critical files changed, run `pnpm exec tsc --noEmit` locally to ensure no fundamental type breakages. Allow the `pre-commit` (lint-staged) to handle formatting.

3. **Atomic Commit Splitting (ADU Principle):**
   - If the staged changes contain multiple unrelated features, fixes, or refactors, you MUST split them into scope buckets.
   - Detect cross-cutting files and attach each to the closest primary bucket by behavior impact. If a file can reasonably fit two groups, place it in the group with the highest runtime impact and note the decision.
   - Use `git restore --staged <file>` to unstage mixed files and stage them logically in groups (`git add <files>`).
   - Every commit must be "Atomic, Descriptive, and Useful" (ADU).

4. **Create Conventional Commits:**
   - **Strict Standard:** Generate commit messages adhering strictly to the `@commitlint/config-conventional` standard: `type(scope): subject`.
   - **English Language:** Commit messages MUST be strictly in English (as per project conventions), even if the discussion is in Spanish.
   - **Title/Subject:** The title must be concise (under 72 characters) and reflect the _most relevant, impactful change_ of the commit (e.g., `feat(calculator): calculate dynamic VAT tax`).
   - **Body (Bullet points):** The body of the commit message must concretely list all affected files and the specific change made to them using a bulleted list. Keep sentences short and to the point.
   - _Format Example:_

     ```text
     feat(ui): add primary call-to-action button

     - components/Button.tsx: implement Button component with variant tracking
     - components/Button.module.scss: add base design tokens and hover states
     - config/theme.ts: expose new CTA color variable
     ```

5. **Execution & Remediation:**
   - Propose the exact `git commit -m "..."` commands. If the user authorizes AutoRun, execute them sequentially.
   - If the Husky `pre-commit` hook fails during the commit attempt, automatically pivot to the `/AUTO_FIX` workflow to remediate the issue without bothering the user.

## Success Criteria

- Staged changes are split into one or more ADU units with clear scope boundaries.
- Every generated commit title matches `type(scope): subject` and passes commitlint.
- Hook-critical checks pass with exit code `0` for each commit command attempted.
- No unintended staged files remain after commit splitting.

## Failure Handling

- If commitlint fails, regenerate the message only and retry.
- If pre-commit fails, execute `/AUTO_FIX`, then retry the exact commit command.
- If split boundaries remain ambiguous after one pass, stop and present two concrete grouping options to the user.
