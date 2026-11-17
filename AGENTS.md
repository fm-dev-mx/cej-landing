# AGENTS.md

Rules for any agent (Claude, Codex, Gemini) working in this repository.

## What this is

`cej-landing` is a mobile-first Next.js landing page (pnpm, SCSS, Supabase, Vercel) with a cost
calculator, Meta Pixel tracking and WhatsApp lead generation. `README.md` covers setup;
`.agents/workflows/` holds the commit, review and conventions workflows.

## Worktrees

- Keep the primary checkout at `D:/code/cej-landing`.
- Create isolated worktrees under `D:/code/cej-landing-worktrees/<work-name>`;
  these are working directories of this repository, not separate projects.
- The first increment uses `D:/code/cej-landing-worktrees/first-increment`,
  branch `feat/cej-first-increment`.
- Run each task's commands from its worktree. Use `git worktree move` when relocating
  a worktree; stop its local processes first and preserve uncommitted/untracked files.

## Checks

- Use Node with pnpm. Before you push, run `pnpm lint`, `pnpm typecheck` and `pnpm test`.
- Husky runs lint-staged and commitlint on commit and a type-check on push. Commit messages are
  conventional, in English, with a lowercase subject.
- Do not reformat files you did not change.

## Pull requests

- Open PRs against `main` from a branch of your own. Local commits on that branch need no
  confirmation.
- Only the owner merges: a merge to `main` deploys to production. Never merge, deploy or push to
  `main` yourself.
- No force push, no `--no-verify` and no `--admin`.

## Never touch

`.env*`, `.secrets/`, `.backups/` and `.vercel/` (the deploy host's config folder).

## Session names

`[<carril> · ]T<n> · <título>`. The full rule lives in the tablero repo, `docs/agent-rules.md`,
«Session name» (D:/code/tablero).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
