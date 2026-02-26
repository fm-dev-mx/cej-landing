---
description: Shared project conventions for language, stack, commit policy, and verification expectations across AI workflows.
---

# Project Conventions for CEJ Landing

## Trigger

Use this document as the baseline policy source when executing any `.agents/workflows/*.md` process.

## Inputs

- Current task scope
- Changed files
- Active workflow instructions

## Execution Steps

1. Apply language rules to code, docs, workflow files, and commit messages.
2. Keep implementation aligned with the declared tech stack.
3. Enforce styling and architecture boundaries before proposing completion.
4. Use commit and testing rules as release-quality gates.

## AI Agent Rules

- **Language**: All code, documentation, workflows, skills, and commit messages MUST be in English. Only the UI itself is presented to the user in Spanish.
- **Tech Stack**: Next.js (App Router), React, TypeScript, SCSS/CSS modules, Vitest.
- **Styling**: Use SCSS/CSS standard practices. Avoid heavy utility classes unless explicitly agreed upon. Maintain the UI agile and lightweight.

## Git Commits

We use Conventional Commits (ADU - Atomic, Descriptive, Useful) enforced by `commitlint` and `husky`.

- `feat`: A new feature
- `fix`: A bug fix
- `chore`: Updating grunt tasks etc; no production code change
- `docs`: Changes to the documentation
- `test`: Adding or adjusting tests

## Testing

- Tests are written using Vitest (`*.test.ts`, `*.test.tsx`).
- Before pushing, ensure all tests pass (`pnpm test`) and the project builds successfully (`pnpm build`).

## Success Criteria

- Output follows language, architecture, and commit conventions without exceptions.
- Required verification commands are run or explicitly reported as blocked.

## Failure Handling

- If a task request conflicts with conventions, propose the closest compliant alternative and explain the tradeoff in one concise note.
