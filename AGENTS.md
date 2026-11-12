# AGENTS.md

Rules for any agent (Claude, Codex, Gemini) working in this repository.

## What this is

`cej-landing` is a mobile-first Next.js landing page (pnpm, SCSS, Supabase, Vercel) with a cost
calculator, Meta Pixel tracking and WhatsApp lead generation. `README.md` covers setup;
`.agents/workflows/` holds the commit, review and conventions workflows.

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
