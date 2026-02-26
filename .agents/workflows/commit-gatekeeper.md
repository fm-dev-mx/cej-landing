---
description: Acts as a semantic commit gatekeeper, enforcing ADU atomic splits, architectural layer isolation, coupling detection, and dead code hygiene. Static quality (any, console, inline styles) is handled by ESLint.
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

2. **Architectural & Semantic Verification (The Gatekeeper Limits):**
   - **Static Quality Verified:** Assume base code quality (no `any`, no `console.log`, no `style={{}}`, and no circular dependencies) is handled by ESLint. Focus strictly on semantical architecture.
   - **High Coupling / God Objects:** REJECT commits if a single file exhibits "God Object" behavior (e.g., tightly coupling complex state management, heavy UI rendering, and raw data fetching within one massive component).
   - **Layer Isolation:** Enforce strict architectural boundaries. UI components MUST NOT directly import or execute database logic (e.g., Supabase clients) outside of Server Actions or API routes. Explicitly review import blocks.
   - **Next.js App Router Integrity:** Ensure no `'use client'` directive is unnecessarily placed at layout boundaries or global scopes. Data fetching must remain server-side by default.
   - **Dead Code / Code Hygiene:** REJECT commits that introduce unjustified commented-out code blocks (5+ consecutive lines), dangling `TODO` comments without a ticket reference or context, or exported functions that are never imported anywhere within the staged diff.
   - **Full Test Suite Validation:** If critical root configuration files change (`next.config.ts`, `vitest.config.mts`, etc.), run `pnpm run test` locally. Otherwise, rely on `lint-staged` to run related tests automatically.

3. **Atomic Commit Splitting (ADU Principle):**
   - If the staged changes contain multiple unrelated features, fixes, or refactors, you MUST split them into scope buckets.
   - **Handling Mixed Files:** If a _single file_ contains changes for multiple distinct features and cannot be cleanly split logically via `git restore --staged <file>`, you must ask the user how to proceed, OR create a single unified commit explicitly explaining the mixed scope in the body. Do not attempt complex line-by-line unstaging autonomously.
   - Every commit must be "Atomic, Descriptive, and Useful" (ADU).

4. **Create Conventional Commits:**
   - **Strict Standard:** Generate commit messages adhering strictly to the `@commitlint/config-conventional` standard: `type(scope): subject`. _The subject must be entirely in lowercase with no trailing punctuation._
   - **English Language:** Commit messages MUST be strictly in English.
   - **Title/Subject:** The title must be concise (under 72 characters) and reflect the _most relevant, impactful change_.
   - **Body (Bullet points):** The body must list affected files and changes. Keep sentences short.
   - _Format Example (Logic):_
     feat(calculator): calculate dynamic vat tax
     - lib/pricing: implement vat calculation logic
     - components/Calculator: display vat results

5. **Execution & Remediation (pwsh Friendly):**
   - Propose the exact `git commit` commands using multiple `-m` flags for the title and body to ensure PowerShell compatibility.
     _Example:_ `git commit -m "feat(ui): add button" -m "- components/Button.tsx: add component" -m "- styles/btn.css: add styles"`
   - If the user authorizes AutoRun, execute them sequentially.
   - **Auto-Fix Loop:** If the Husky `pre-commit` hook fails, pivot to the `/AUTO_FIX` workflow. **CRITICAL:** If `/AUTO_FIX` remediates an issue and modifies files, you MUST run `git add <files>` to restage them _before_ retrying the exact commit command.

## Success Criteria

- Staged changes are split into ADU units with clear scope.
- Commit titles match `type(scope): subject` (lowercase subject).
- Hook-critical checks pass with exit code `0`.
- No unintended staged files remain.

## Failure Handling

- If commitlint fails, regenerate the message and retry.
- If pre-commit fails, run `/AUTO_FIX`. Then `git add <fixed-files>`. Then retry.
- If split boundaries are ambiguous or files are highly coupled, STOP and ask the user for direction.
