# CEJ first increment — execution record

## Contract and boundaries

The owner's 2026-11-14 prompt is the executable contract. Both ChatGPT Library links returned login pages and the document connector reported no sessions. The detailed T00–T11 plan and subtask definitions are unavailable: do not invent their mapping or certify their completion. T12 is excluded. No commits, pushes, production migrations, imports, marketing events or deployments are authorized.

Workspace: `D:/code/cej-landing-worktrees/first-increment`, branch `feat/cej-first-increment`, isolated from the clean `D:/code/cej-landing` main worktree. Base main `d294304`; inspected remote-tracking develop `5b6010bd0c5735a6a9206a76ba721556eb25b61a` (not proof of the remote's latest state).

At the owner's request, the worktree was relocated with `git worktree move` into
the dedicated sibling folder `D:/code/cej-landing-worktrees`, following Celebra-me's
layout. All 229 source/evidence files (excluding protected environment files) had
the same aggregate SHA-256 before and after the move. The branch, uncommitted and
untracked work, and local database identity were preserved. Future isolated CEJ
worktrees belong under this folder; `cej-landing` remains the active repository.

Relocation verification: Windows pnpm junctions initially referenced the previous
absolute path, so dependencies were relinked with `pnpm install --frozen-lockfile`
without changing dependency versions or the lockfile. `pnpm typecheck` and all 10
`pnpm test:integration` cases passed again from the new location, using the same
persistent isolated database. The migration and production boundaries are unchanged.

## Audit and reuse

| Source                                                         | Destination / decision                                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| main `lib/pricing.ts`, `config/business.ts`, public components | Preserve public behavior; internal offers use the same engine and catalog. Preserve main's expanded strengths, 2 m³ direct minimum and 7/10/15 cm coffered factors.                                                                                                                                                               |
| develop `docs/schema.sql`                                      | Selectively recover canonical tables/enums and append-only/payment-summary functions into the empty-database baseline migration. Omit destructive cleanup, unsafe metadata profile triggers, global policies and direct import scripts. Existing installations require schema comparison and an additive cutover before applying. |
| develop `lib/schemas/internal/order-status.ts`                 | Recover status vocabulary; keep transition enforcement only in the transactional SQL command.                                                                                                                                                                                                                                     |
| develop dashboard actions                                      | Do not expose: metadata roles, user-as-tenant, mixed getMyOrders/listOrders/listAdminOrders scopes, service-role queries without company scope, divergent phone normalization and ordered_at-as-delivery-time require correction. One company-scoped query and command boundary replaces those routes.                            |
| develop expenses/payroll                                       | Preserve canonical table definitions, omit initial menu and writes.                                                                                                                                                                                                                                                               |
| develop staging/importers                                      | Reuse canonical batch/rejection/import-log concepts; never execute direct importers. Historical source values must not be repriced.                                                                                                                                                                                               |

There is one active repository and implementation per module. `/panel` is canonical; `/dashboard` compatibility redirects do not mount duplicate pages. No creative-ops publication contracts apply.

## Confirmed decisions

- Generic quotes need no customer or lead. Persist immutable commercial snapshots/revisions; all exports consume those values.
- Formal issue requires reviewed company profile, terms and validity. Main and develop addresses conflict; no invented replacement.
- Samalayuca only: MXN 1,500/truck, default configurable capacity 7 m³, ceil(volume/capacity), +1 pumped; positive integer manual count and reason. Tax treatment remains unknown; affected offers remain drafts until explicitly configured. Operational count adjustments are not rate discounts.
- Fiber is MXN 130/m³ gross in main. Coffered 7/10 cm are calculation parameters (0.085/0.108 m³/m²), not concrete thickness or verified sale products. No separate sale price is evidenced.
- A sale is customer acceptance plus team confirmation, regardless of payment. Payments and delivery never create another sale.
- Internal reminders are visible when the panel is opened/refreshed; no background notification channels are promised.
- Marketing is disabled for production; unknown customer source/identity stays unknown. Employee browser data must never become customer matching data.

## Board integration — 2026-11-14

Objective T1419 cej-primer-incremento and six child tasks now exist in the active
board, using `D:/code/celebra-me/tablero.config.json`, and are visible through its
HTTP UI projection and task endpoints on port 4320. See
[active board tracking](board-tracking-active.md) for fixed task references,
waits/dependencies, stored prompts and verification. No agent is assigned or
dispatched; local implementation is not marked accepted.

The owner explicitly authorized the named config edit and controlled server restart
(“Procede”), after the checkout/lane mismatch and no-restart rules were explained.
This narrow exception added only the CEJ registry entry and restarted only `serve`
on its previous port/config. No index/branch/history, watcher or Production changes
were performed. The seven preparation copies in the different central store were
cancelled via CLI with replacement references. No unrelated record was migrated,
deleted or edited. `board-transfer.json` records the mapping; `board-activation.md`
records the authorized scope and evidence.

Global verification retains a preexisting unrelated `entregada` failure; CEJ's only
added warning is its intentionally unassigned review task. Product tests were not
rerun for this configuration/documentation activation.

## Dependencies / blocked acceptance

- Attach `Registro CEJ Captura (1).xlsx` to inspect and reconcile real migration. No control totals are inferred from the wrong workbook or previous reports.
- Supply accessible detailed plan to reconcile exact T00–T11/T05A/T05B/T05C/T08A task mapping.
- Owner review of legal company details, validity/terms and Samalayuca tax classification is required before affected formal offers.
- Production schema/data, membership provisioning, destination permissions, dataset and Meta acceptance/attribution require a separate authorized cutover. Local rehearsal is not production readiness.
- Operator targets (search 15 s, known capture 90 s, reschedule 30 s) are future acceptance measurements, not measured results.

## Scope estimate

The previous 14-day estimate is superseded. This is a multi-module product increment with schema/security, offer lifecycle, CRM, scheduling, commercial facts, document generation, import reconciliation and cutover. Planning allowance after this local implementation: 2–4 engineering days for independent review and operator feedback, 2–5 for the correct workbook mapping/reconciliation, and 2–4 for target-environment adaptation and cutover rehearsal. Total 6–13 engineering days, excluding owner/access waits; workbook structure and production drift can change this range. This is an estimate, not a renewed 14-day commitment.

## Verification log

- Baseline main: 14 test files / 264 tests passed. Independent main lint inspection found 13 errors and one warning before this work.
- `pnpm dlx supabase@3.1.0 db reset --local`: replayed all six migrations on dedicated loopback database `127.0.0.1:55422`; completed. No target production connection. The missing optional seed-file warning was removed by disabling SQL seed; fixtures are explicitly provisioned by `local:seed`.
- `pnpm test:integration`: 10 passed after the clean replay. Real PostgreSQL/Auth/RLS and server commands, including two-company isolation, hostile editable metadata, viewer/operator restrictions, immutable revisions, exact authorization, PDF/PNG generation, request-to-quote-to-order linkage, no-deposit sale confirmation, payment separation, concurrent scheduling/version conflicts, follow-up chaining, search beyond the initial 50 choices, historical staging/promotion/idempotency and outbox leasing/retry/deduplication. Only Next request cookies and the injected marketing transport are substituted.
- `pnpm test`: 298 passed across 24 files; the 10 local integration cases are intentionally skipped in the ordinary suite and executed separately. Existing public-modal cases were retained; the old success-on-failure expectation was changed to require an error and retained capture. Two additional regression cases cover retry identity and concurrent submission.
- `pnpm typecheck`: passed.
- `pnpm local:build` (runs `pnpm build` with the isolated stack's configuration): passed after the final refinements, including TypeScript and generation of all public/panel routes. Pixel configuration is intentionally absent in this isolated environment.
- `pnpm test:browser`: all four Chromium flows passed at 360 × 800 using the real local database: persisted quote/reload/exports and panel Pixel exclusion; direct order/no-deposit confirmation/scheduling/search return; public calculator/request/WhatsApp preparation and compatibility redirect; inline customer/project creation preserving quote values. Initial public test failures came from selectors for the wrong calculator variant and an unnecessary click after the drawer already opened; the final test follows the actual accumulated-order flow without forced clicks.
- Changed-file ESLint (excluding the preexisting public marketing inline-style violation): passed. `pnpm lint`: six preexisting errors and one warning remain (marketing layout and WizardAdapter inline styles, two SocialProof quote escapes, FeedbackToast/useIdentity effect state updates, and an unused icon type warning). Full lint is not a green release gate; no suppression or rule weakening was added.
- Screenshots: `docs/evidence/quote-mobile.png`, `docs/evidence/orders-mobile.png`; visually inspected. These are synthetic development fixtures, including the development indicator. One Tab traversal is verified; this is not a full accessibility audit or the operator timing study.

## Implemented functional slices

| Slice               | Current local behavior                                                                                                                                                                                                  | Remaining acceptance                                                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Core and recovery   | Main public engine preserved; selected develop tables/functions recovered; canonical `/panel` and compatibility redirects; managed server memberships and RLS.                                                          | Compare actual target schema/data and provision reviewed memberships.                                                                           |
| Quotes              | Generic/formal, official shared catalog, Samalayuca rule, fiber and geometric coffer helper; immutable revisions; exact economic approvals; PDF/image/WhatsApp text consume one snapshot.                               | Owner-reviewed real business profile/conditions/validity and Samalayuca tax classification.                                                     |
| Customers and works | Searchable server choices, inline creation without losing quote data; responsible team member; customer/project commercial history; real request links.                                                                 | Operator usability acceptance; historical data after reconciliation.                                                                            |
| Orders and agenda   | Direct or accepted-revision orders; no-deposit sale confirmation; sold/collected/delivered separation; actual payment history; day/week/two-week schedule with optimistic versions and overlap acknowledgement/history. | Timed operator exercises; physical resource rules remain intentionally unspecified.                                                             |
| Follow-up           | Today/overdue/upcoming, server pagination, responsible, complete/result/next action inherited without recapture.                                                                                                        | No out-of-session notification delivery is implemented.                                                                                         |
| Measurement         | Real request/sale facts and outbox created atomically; no conversion from quote/copy/export/import/payment; public request event ID retained for deduplication.                                                         | Destination verification, legitimate eligibility inputs and an authorized external test. Current transport is injected synthetic evidence only. |
| Excel               | Hidden/visible provenance, explicit mapping, durable preview/issues, stable-content idempotency and reviewed historical promotion without repricing/overwriting.                                                        | Correct workbook unavailable; real mapping, corrections, totals, payments and delivery reconciliation are not certified.                        |
| Cutover             | Local replay, tests, boundary inventory and recovery checklist in `docs/cutover-review.md`.                                                                                                                             | No production schema access, migration application, import, publication or acceptance is claimed.                                               |

These are local slices, not fabricated T00–T11 assignments: the linked detailed plan remains inaccessible. No evidence supports a completed production increment.

## Changed implementation areas

- `app/panel/**`, `app/login/**`, `components/panel/**`: operational UI and thin action boundaries.
- `lib/commercial/**`, `lib/auth/**`, `lib/supabase/**`, `lib/phone.ts`, `types/database.ts`: canonical services, snapshots, documents, imports, eligibility and generated database types.
- `supabase/migrations/202611140001–006`, `supabase/config.toml`: isolated empty-database candidate, company RLS and transactional writes.
- Public layouts, `app/actions/submitLead.ts`, `lib/pixel.ts`, both existing public lead modals and `hooks/useLeadSubmission.ts`: advertising confined to public routes; persisted requests before success/tracking, stable retry ID and no assumed privacy acceptance.
- `scripts/local-run.mjs`, package/lock and tests: pinned loopback CLI runner and synthetic evidence.
- `public/fonts/NotoSans-Regular.ttf` and `OFL.txt`: bundled PDF font from the official Noto fonts repository. SHA-256 `b85c38ecea8a7cfb39c24e395a4007474fa5a4fc864f6ee33309eb4948d232d5`; font license retained.
- `AGENTS.md`: Next.js itself appended its agent-guide block while running `next dev`; original repository instructions remain intact. This tool-generated change is explicit, not an unreported policy rewrite.

## Reproduce locally

Use Docker Desktop, Node 24 and pnpm 10.30.2 from `D:/code/cej-landing-worktrees/first-increment`. The Supabase project ID remains `cej-increment`; it is a database identity, not a worktree path. API/DB ports are 55421/55422. Existing other Supabase projects are not this target.

```powershell
pnpm install --frozen-lockfile
pnpm dlx supabase@3.1.0 start -x studio,imgproxy,edge-runtime,logflare,vector,supavisor,realtime,storage-api,postgres-meta
pnpm local:seed
pnpm local:dev
```

Open `http://127.0.0.1:3100/login`. Synthetic accounts are `owner-a@cej.invalid`, `operator-a@cej.invalid`, `viewer-a@cej.invalid`, `owner-b@cej.invalid` and unassigned `unassigned@cej.invalid`; local-only password is `synthetic-local-CEJ-2026-only`. These are fake fixtures and confer no access outside this owned loopback stack. Real business profile fields are not seeded; integration tests use a clearly synthetic profile.

Run `pnpm test`, `pnpm test:integration`, `pnpm test:browser`, `pnpm typecheck`, `pnpm lint`, `pnpm local:build`. The runner obtains local keys in memory, refuses a different API URL, and never writes `.env` files. It disables advertising IDs and uses a synthetic WhatsApp target in its child environment. Integration/browser fixtures persist across runs; tests may add synthetic records. Browser tests prepare WhatsApp through a stubbed window, without opening a third-party page or sending a message.

Stopping the owned stack with `pnpm dlx supabase@3.1.0 stop` preserves its data. Do not use volume deletion for routine shutdown. To deliberately rebuild only this synthetic project, verify cwd/project/port, then use `pnpm dlx supabase@3.1.0 db reset --local`, followed by `pnpm local:seed`; this destroys that project's synthetic rows. Never reuse this reset command for an external environment.
