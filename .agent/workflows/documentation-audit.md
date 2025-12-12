---
description: Documentation audit and UX alignment workflow for cej-landing
---

# Documentation Audit Workflow

Standards and process for auditing, maintaining, and evolving documentation in `cej-landing` (Next.js App Router + TypeScript + SCSS modules).

## Principles

- **Docs are operational**: they must help ship changes safely (not just describe).
- **Server-first** (App Router): client components only when necessary.
- **UI copy is Spanish**; code, file names, comments, and docs are English.
- **No PII in tracking** (Meta Pixel).

## Scope

This workflow covers documentation for the public landing (`/`) and related shared modules (calculator, CTA, tracking, pricing, validation, accessibility). It does not define internal portal plans unless explicitly referenced by the ROADMAP.

## Guardrails

- **Do not modify** `lib/pricing.ts`, `lib/tracking/**`, or the global state store (e.g., Zustand) **unless** you identify a bug, a security issue, or a clear bad practice with measurable impact.
- Avoid large refactors while “fixing docs”. Prefer small, explicit deltas.

---

## 1. Documentation Map (Source of Truth)

Maintain a clear hierarchy with responsibilities:

### Product & Planning

- `docs/ROADMAP.md` — Phases, milestones, delivery priorities
- `docs/DECISIONS.md` — Durable business/tech decisions (ADR-lite)
- `docs/REQUIREMENTS.md` — Must-haves, acceptance criteria, constraints

### Architecture & Engineering

- `docs/ARCHITECTURE.md` — App Router boundaries, data flow, integration points
- `docs/TRACKING.md` — Pixel events, payload rules, environments
- `docs/PRICING.md` — Pricing inputs, rules, edge cases (no business secrets)
- `docs/DESIGN_SYSTEM.md` — Tokens, components, layout, responsive rules

### Quality & Operations

- `docs/ACCESSIBILITY.md` — WCAG targets, implemented patterns, testing
- `docs/TESTING.md` — Unit/integration/e2e guidance (if applicable)
- `docs/RELEASE.md` — How to ship safely (build checks, env checks)

> Rule: every doc must state **Owner**, **Last updated**, and **Related files**.

---

## 2. Documentation Standard Structure

Every doc should follow:

1. **Purpose**
2. **Scope**
3. **Definitions / Glossary**
4. **Rules**
5. **Examples**
6. **Edge cases**
7. **Acceptance criteria**
8. **Links / References**
9. **Changelog** (brief; link to CHANGELOG if needed)

---

## 3. Business Rules to Keep Consistent

### 3.1 Quote Lifecycle States

Define and use consistent states (names may vary in code, but the concept must match):

- `draft` — User editing inputs; no lead created.
- `estimated` — A computed result exists; shown to user.
- `lead_created` — A lead is created (e.g., quote ticket generated).
- `contacted` — User initiated contact (WhatsApp / phone).
- `followup_scheduled` — Sales follow-up set (if used).
- `confirmed` — Sales confirmed order (formal).

> The UI should not expose internal-only states if they don’t change user decisions.

### 3.2 SLA Copy (Timezone + Business Days)

- **Timezone:** Zona horaria de Juárez, Chih. (GMT-7)
- **Business days:** Lunes a viernes (a menos que CEJ defina lo contrario)
- **Cutoff example:** “después de las 16:00 horas locales”

> Saturday halftime to be defined.

Spanish UI copy examples:

- Before cutoff:
  - “Te contactamos hoy.”
- After cutoff:
  - “Te contactamos el siguiente día hábil.”

> Avoid ambiguous “mañana” without context; prefer “siguiente día hábil” in business flows.

---

## 4. Tracking Acceptance Criteria (Meta Pixel)

This project requires Pixel events:

- `PageView`
- `ViewContent`
- `Lead`
- `Contact`

### 4.1 Event Triggers (Mapping)

- `PageView`: on page load (standard).
- `ViewContent`: when the user **views/interacts** with the calculator (e.g., calculator becomes visible, or first valid calculation).
- `Lead`: when a user generates a quote/ticket or submits the lead form (whichever is defined as “lead created” in product).
- `Contact`: when the user clicks **WhatsApp** or **Phone call** CTA.

### 4.2 Payload Requirements

- Always include:
  - `currency: "MXN"`
  - `value: <number>` (MXN total or meaningful subtotal; must match product definition)
- Never include PII (no phone, email, name, RFC, address in Pixel payload).
- Use stable identifiers:
  - `eventID` (or equivalent) for deduping (recommended if CAPI is added later).

### 4.3 WhatsApp Prefill Requirement

Prefill must include:

- “Cotización CEJ …”
- Key inputs (m³, strength/type/zone if relevant)
- **Total formatted**: `$X MXN`

Example (Spanish UI text):

- “Cotización CEJ — Vol: 6.00 m³ — Total: $12,345.00 MXN”

### 4.4 Documentation Checklist (Tracking)

- [ ] `docs/TRACKING.md` matches code triggers
- [ ] Event names match exactly
- [ ] `value` and `currency` are set for `Lead` and `Contact`
- [ ] No PII included
- [ ] Env vars documented: `NEXT_PUBLIC_PIXEL_ID`, `NEXT_PUBLIC_SITE_URL`

---

## 5. App Router / React / TypeScript Consistency

- [ ] Server Components are the default
- [ ] `'use client'` only when required (state, effects, event handlers, browser APIs)
- [ ] Avoid `window`/`document` usage in Server Components
- [ ] Keep derived calculations in pure utilities when possible
- [ ] Avoid prop drilling beyond 2 levels (prefer composition, context, or store)

---

## 6. Accessibility Documentation Consistency

- [ ] Inputs have label + `aria-describedby` for errors/help
- [ ] Error messages use `role="alert"` or `aria-live` appropriately
- [ ] Focus states are visible
- [ ] Icon-only buttons have an accessible name (`aria-label`)
- [ ] Dialogs define `aria-modal`, focus trap, escape to close (if applicable)

---

## 7. “Known Gaps” vs “Open UX Issues”

Keep these separate:

### 7.1 Known Gaps (Product/Business)

- Missing decision on quote validity display (public vs formal)
- Missing decision on what cost breakdown is public

### 7.2 Open UX Issues (Implementation)

- Hybrid on-blur validation behavior in the calculator form
- Error focus on submit
- Visual state for history items
- SLA message based on time-of-day (timezone aware)

> UX issue items must link to either an issue ID or a location in code.

---

## 8. Must-Haves Status (Landing MVP)

These are project “must-haves” and should not remain “planned” if required for MVP:

- [ ] Hero + Calculator + Sticky CTA (WhatsApp / Phone)
- [ ] Validation + MXN format + totals breakdown
- [ ] Pixel events with `value`/`currency`
- [ ] WhatsApp prefill includes total

> Optional / planned extras (only if the roadmap says so): PDF download, share quote link, scheduling delivery.

---

## 9. Output Format (When Auditing)

When you audit docs, produce:

- **Findings** grouped by severity:
  - **P0**: breaks MVP, tracking, compliance, or causes regressions
  - **P1**: likely confusion / drift / missing acceptance criteria
  - **P2**: polish / consistency improvements
- **Estimate** per item: **S / M / L**
- **Concrete file edits** (which docs change, and why)
