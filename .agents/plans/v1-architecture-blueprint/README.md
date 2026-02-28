# Plan: v1 Architecture Blueprint — Strategic Redesign

**Initiative:** Comprehensive architectural analysis, risk mitigation, and phased execution strategy for the cej-landing v1 conversion redesign.
**Status:** 📋 Planning — not yet executed
**Created:** 2026-02-27
**Stack:** Next.js 15 App Router · TypeScript · Supabase · SCSS · Zustand · Vitest

---

## Overview

This blueprint restructures the product into two distinct audiences:

| Surface | Audience | Goal |
|---|---|---|
| `/` (public group) | Anonymous visitor | Convert to WhatsApp lead with zero friction |
| `/dashboard` (admin group) | Authenticated admin | Register and manage orders |

It contains deep architectural analysis, CAPI tracking strategy, UX optimization frameworks, dashboard scalability planning, and a comprehensive compliance checklist.

> **Relationship to Quick Wins:**
> The [v1-quick-wins](../v1-quick-wins/) plan extracts the most impactful
> tactical steps from this blueprint for immediate execution.
> This blueprint covers the full scope including store splits, bundle isolation,
> CAPI retry/dead-letter, RBAC, Proxy protection, and the compliance audit.

---

## Execution Phases (6 phases, designed for separate conversations)

| Phase | Focus | Key Deliverables |
|---|---|---|
| **Phase 0** | Foundation | Proxy adoption, route group rename, security headers |
| **Phase 1** | Bundle Isolation | Store split (public/admin), layout decoupling |
| **Phase 2** | Tracking | CAPI retry, Contact endpoint, UTM consolidation |
| **Phase 3** | UX Optimization | Form validation, fire-before-navigate, mobile polish |
| **Phase 4** | Dashboard Hardening | RBAC, cursor pagination, caching, admin shell |
| **Phase 5** | Compliance Sweep | Full checklist audit, GO/NO-GO report |

See [`EXECUTION_PROMPT.md`](./EXECUTION_PROMPT.md) for copy-paste prompts per phase.

---

## File Index

| File | Scope |
|---|---|
| [`structure.md`](./structure.md) | Architecture & boundaries: directory layout, state management, routing, Proxy logic |
| [`01-architectural-audit.md`](./01-architectural-audit.md) | Risk & debt analysis: 12 findings from P0 to P3 severity |
| [`02-conversion-capi-strategy.md`](./02-conversion-capi-strategy.md) | Event taxonomy, deduplication, CAPI retry, dead-letter queue, UTM consolidation |
| [`03-ux-friction-reduction.md`](./03-ux-friction-reduction.md) | UX state machine, form validation, fire-before-navigate, mobile optimization |
| [`04-dashboard-roadmap.md`](./04-dashboard-roadmap.md) | Entity relationships, RBAC, pagination, caching, admin shell wireframes |
| [`05-compliance-checklist.md`](./05-compliance-checklist.md) | 60+ verification items across routing, tracking, performance, security, accessibility |
| [`EXECUTION_PROMPT.md`](./EXECUTION_PROMPT.md) | Phase-by-phase agent prompts with mandatory pre-reading and scope constraints |

---

## Shared Constraints (apply to all phases)

- **Language:** All code, comments, and docs in English. All UI copy in Spanish (es-MX).
- **Styling:** Vanilla SCSS only. Use existing `_tokens.scss` design tokens. No Tailwind, no inline styles.
- **Tests:** Every changed file must have updated or new Vitest unit tests.
- **Commits:** Each phase = one or more atomic commits following `/commit-gatekeeper` (Conventional Commits + ADU).
- **Validation gate before each commit:**
  ```bash
  pnpm lint && pnpm typecheck && pnpm test --run
  ```
- **Fail-Open principle:** No change should cause the WhatsApp CTA to fail silently. Any new server path must be wrapped in try/catch with `reportError`.
- **No new npm dependencies** unless strictly necessary and justified in the plan file.
