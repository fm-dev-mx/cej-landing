# Execution Prompt: v1 Conversion Redesign

> **Instructions for the agent:** Copy this entire prompt into a new conversation. The plan files referenced below are your source of truth for each step. Do not deviate from the defined scope per step. Read the referenced plan file fully before writing a single line of code.

---

## Project Context

You are working on `cej-landing`, a Next.js 15 (App Router) landing page for a concrete supplier in Juárez, México. The stack is TypeScript, Supabase, SCSS Modules, Zustand, and Vitest.

- **All code, comments, and documentation must be in English.**
- **All UI copy must be in Spanish (es-MX).**
- **Design tokens** are in `styles/_tokens.scss`. Use them — no hardcoded colors or spacing values.
- **No Tailwind.** No inline styles. No new UI libraries.
- **Every changed file must have updated Vitest unit tests.**
- **Validation gate before every commit:** `pnpm lint && pnpm typecheck && pnpm test --run`

Architecture reference: `docs/ARCHITECTURE.md`
Design reference: `docs/UX_STANDARDS.md`, `docs/DESIGN_SYSTEM.md`
DB schema: `docs/DB_SCHEMA.md`, `docs/schema.sql`

---

## Plan Files (Your Source of Truth)

All plan files are in `.agents/plans/v1-conversion-redesign/`. Read each one in full before executing the corresponding step. They contain:
- Exact file paths to create/modify
- Code snippets for the most architecturally sensitive parts
- Explicit test cases to implement
- Commit message templates
- Manual validation checklist

| Step | Plan File | Scope |
|---|---|---|
| 0 | `00-tracking-fixes.md` | CAPI `external_id`, `fn`, env-controlled Test Event Code |
| 1 | `01-remove-public-login.md` | Strip login UI from public Header |
| 2 | `02-admin-dashboard.md` | Route protection, login page, admin order creation |
| 3 | `03-optional-form-ux.md` | WhatsApp-first dual CTA, optional data capture form |
| 4 | `04-calculator-conversion.md` | ViewContent, InitiateCheckout, SPA PageView |

---

## Execution Instructions

### Step Execution Protocol

For each step, you must:

1. **Read the plan file** for that step using your file-reading tool. Do not skip this.
2. **State your understanding** of what will change and why before touching any file.
3. **Check pre-conditions** listed in the plan file. If they are not met, stop and report.
4. **Implement changes** exactly as specified. If you find a discrepancy between the plan and actual code (e.g., a component has moved), adapt minimally and note the deviation.
5. **Write the tests** listed in the plan file's "Tests to Write" section. Tests are not optional.
6. **Run the validation gate:** `pnpm lint && pnpm typecheck && pnpm test --run`. Report the output.
7. **Propose the commit** using the template in the plan file. Do not execute `git commit` unless explicitly told to.

### Step Order

Steps **must** be executed in order: 00 → 01 → 02 → 03 → 04.

Steps 00 and 01 are independent of each other and may be parallelized if you can handle it safely, but step 02 is blocked on step 01, and step 04 is blocked on steps 00 and 03.

### Scope Boundaries (Hard Rules)

- **Step 00:** Touch only `lib/tracking/capi.ts`, `app/actions/submitLead.ts`, `config/env.ts` (both `envSchema` AND `processEnv` object), `.env.example`. Nothing else.
- **Step 01:** Touch only `components/layouts/Header/Header.tsx`. `MobileMenu.tsx`, `useHeaderLogic.ts`, and `header.types.ts` already contain no auth UI — do not touch them.
- **Step 02:** Touch `app/(app)/dashboard/layout.tsx` (redirect fix), `middleware.ts` (new), `lib/supabase/middleware.ts` (new), `app/auth/login/` (verify/create), `app/(app)/dashboard/page.tsx` (add new order CTA), `app/(app)/dashboard/new/` (new page), `app/actions/createAdminOrder.ts` (new). Do **not** touch `app/actions/submitLead.ts` — admin orders use a dedicated action.
- **Step 03:** Touch `components/Calculator/QuoteCTA/` (new), `lib/utils.ts` (add `buildQuoteMessage` if compatible), and the existing `LeadFormModal` (or equivalent checkout modal component — add close button + privacy note). **Do not** create `lib/logic/folio.ts` — use existing `generateQuoteId` from `lib/utils.ts`.
- **Step 04:** Touch only `lib/tracking/visitor.ts`, `components/PageViewTracker/` (new), `app/layout.tsx` (PageViewTracker mount only), and the result display component identified in step 03. Use a derived `quoteKey` for `useEffect` deps — no `[]` empty arrays with ESLint suppressions.

---

## Expected Outcomes

After all steps are completed:

1. **Public landing page** has no login button or any reference to `/login` in its UI.
2. **`/dashboard`** redirects unauthenticated users to `/login`. Authenticated admins can create and manage orders.
3. **Quote result** shows a WhatsApp CTA as the primary action. No data entry is required to convert. The optional form is a secondary path.
4. **Meta Pixel** fires `PageView` on every route, `ViewContent` on quote result, `InitiateCheckout` on form open, `Lead` on form submit.
5. **Meta CAPI** sends `Lead` with `ph`, `em`, `external_id`, `fn`, `fbp`, `fbc` — projected EMQ 7.5–8/10.
6. **`META_TEST_EVENT_CODE`** is controlled via environment variable, not commented-out code.
7. All existing tests pass. New tests added per plan.

---

## Starting Point Verification

Before beginning step 00, run:

```bash
pnpm lint && pnpm typecheck && pnpm test --run
```

If any of these fail, stop and report the failures. Do not proceed with changes until the baseline is green.

---

## Asking for Help

If at any point you encounter an ambiguity that is not resolved by the plan files or the project's existing documentation (`docs/`), ask a targeted, single question before proceeding. Do not make assumptions that affect scope.
