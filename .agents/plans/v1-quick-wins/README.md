# Plan: v1 Quick Wins — Conversion Funnel Fixes

**Initiative:** Tactical, self-contained steps to remove friction from the public landing page and upgrade the calculator-to-WhatsApp conversion funnel.
**Status:** 📋 Planning — not yet executed
**Created:** 2026-02-26
**Stack:** Next.js 15 App Router · TypeScript · Supabase · SCSS · Zustand · Vitest

---

## Overview

This plan contains **five sequential, tactical steps** that deliver immediate value:

1. Fix Meta Pixel/CAPI data quality issues (EMQ boost)
2. Remove the public login button (reduce visual noise)
3. Protect the admin dashboard with middleware
4. Add a WhatsApp-first dual CTA (reduce form friction)
5. Activate missing analytics events (ViewContent, InitiateCheckout, SPA PageView)

Each step is self-contained with its own pre-conditions, test cases, and commit template.

> **Relationship to the Architecture Blueprint:**
> These quick wins address the most impactful items from the full
> [v1-architecture-blueprint](../v1-architecture-blueprint/) analysis.
> The blueprint contains deeper strategic changes (store split, bundle isolation,
> CAPI retry, RBAC, compliance audit) that are phased separately.

---

## Execution Order

All steps must be executed in strict order. Each plan file is self-contained and has a `Pre-conditions` section. Do not start a step if its pre-conditions are not met.

```
Step 00 → Meta Pixel / CAPI quick fixes (non-breaking, isolated)
Step 01 → Remove login button from public Header
Step 02 → Protect /dashboard with middleware + login page
Step 03 → Redesign post-quote UX (optional form + WhatsApp-first)
Step 04 → Activate missing analytics events (ViewContent, InitiateCheckout, PageView SPA)
```

> **Why tracking fixes first?** Steps 03 and 04 add new tracking calls (`trackViewContent`, `trackInitiateCheckout`). If CAPI fixes land in the same commit, the diff becomes unreadable and test coverage gets entangled. Isolating tracking fixes first keeps each commit atomic and makes rollbacks surgical.

---

## File Index

| File | Scope |
|---|---|
| [`00-tracking-fixes.md`](./00-tracking-fixes.md) | CAPI `external_id`, env-controlled Test Event Code |
| [`01-remove-public-login.md`](./01-remove-public-login.md) | Strip login UI from Header and MobileMenu |
| [`02-admin-dashboard.md`](./02-admin-dashboard.md) | Route protection, login page, admin order management |
| [`03-optional-form-ux.md`](./03-optional-form-ux.md) | WhatsApp-first dual CTA, optional data capture |
| [`04-calculator-conversion.md`](./04-calculator-conversion.md) | ViewContent, InitiateCheckout, SPA PageView, persistence |
| [`EXECUTE.md`](./EXECUTE.md) | Execution prompt for agents (copy-paste into new chat) |

---

## Shared Constraints (apply to all steps)

- **Language:** All code, comments, and docs in English. All UI copy in Spanish (es-MX).
- **Styling:** Vanilla SCSS only. Use existing `_tokens.scss` design tokens. No Tailwind, no inline styles.
- **Tests:** Every changed file must have updated or new Vitest unit tests.
- **Commits:** Each step = one or more atomic commits following `/commit-gatekeeper` (Conventional Commits + ADU).
- **Validation gate before each commit:**
  ```bash
  pnpm lint && pnpm typecheck && pnpm test --run
  ```
- **Fail-Open principle:** No change should cause the WhatsApp CTA to fail silently. Any new server path must be wrapped in try/catch with `reportError`.
- **No new npm dependencies** unless strictly necessary and justified in the plan file.
