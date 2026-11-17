# First-increment cutover review — not executed

This is a review gate, not authorization to change production. The candidate migrations initialize an empty isolated database. They cannot be applied blindly to the existing CEJ database, where canonical tables and imported records may already exist. The owner must authorize the specific target and operations after reviewing concrete evidence.

## Evidence required before a target change

1. Obtain the accessible detailed plan and reconcile its T00–T11/subtask acceptance criteria with `first-increment.md`. Record differences against the owner's seven confirmed decisions; the prompt takes precedence.
2. Inventory the real target schema, policies, triggers, functions, deployed main revision and existing imports using an explicitly authorized read-only connection. Record current row counts and source identifiers without exporting personal data into this repository. Establish an additive migration against that observed schema; keep canonical customer/order/payment/import masters. Unknown ownership must remain quarantined, never inferred from an auth user.
3. Review legal issuer details, terms, validity, tariffs/version and the unresolved Samalayuca tax treatment. Confirm which company owns the public hostname. Configure that explicit binding only after checking existing public request records. Until then the public lead path preserves its legacy unassigned capture.
4. Provision real memberships through the controlled server workflow. Bootstrap the first owner only through the approved administrative procedure. Check a second synthetic tenant, unknown user, viewer, operator, last-owner protection and browser/RPC denial before exposing the panel.
5. Inspect **Registro CEJ Captura (1).xlsx**, including hidden sheets/rows and formulas. Record its hash, source version and per-sheet mapping. Check existing imported references before promotion. Resolve each missing/ambiguous date, timezone, amount, payment and delivery explicitly; preserve unknowns. Reconcile source rows, duplicates, rejected/staged/promoted counts, original volumes and original totals. Historic sales cannot be reconstructed with today's tariffs. Repeat and reorder the same source to demonstrate idempotency; an old source cannot overwrite a newer capture.
6. Rehearse the exact additive changes and reviewed import on a separately authorized test target. Run the documented checks and a restore rehearsal; keep the captured diff, migration history and reconciliation outside public artifacts. No production marketing events are permitted during rehearsal.
7. Have an operator perform measured search (15 s), known capture (90 s) and reschedule (30 s) exercises on 360 px and desktop with keyboard. These numbers are acceptance targets; the current automated test durations are not operator measurements.
8. Resolve the known public baseline lint failures or explicitly agree their handling before proposing a release. Independently review the full uncommitted change, especially service-role boundaries, source ownership, immutable revision authorization and marketing exclusion/deduplication.

## Concrete release boundary

- The public root and calculator keep the main pricing engine/catalog. `/panel` is the single operational surface; `/dashboard` redirects. Existing expenses/payroll definitions are retained without initial menus.
- Capture the exact reviewed branch revision and migration/import manifest. No force push, hook bypass, protected-folder edits, `main` push, merge or deployment is part of this work.
- Back up the approved target and verify restoration before its migration. The owner chooses the protected storage and retention; no `.backups` access or backup operation has been performed here.
- Approve schema application, reviewed import and application publication separately. Keep marketing disabled through application cutover. A Meta destination, eligible customer data and an authorized test receipt must be verified separately before enabling dispatch; API acceptance never proves attribution.
- Compare pre/post counts, canonical references, original monetary totals, RLS denials, public request persistence and request→revision→order links. Missing totals remain unknown; do not manufacture balancing entries.

## Recovery gates

- If an application-only defect appears and no new operational writes occurred, redeploy the previously approved application revision through the owner-controlled process. Do not attempt an unreviewed down migration.
- If new writes occurred, stop affected mutations, preserve the new facts and reconcile them against the last consistent snapshot before restoring or replaying. A blind restore would lose orders, payments or confirmations and is not a safe rollback.
- A failed Meta transport leaves the sale intact. Disable dispatch and retry the same stable fact/event ID after diagnosis; do not create a replacement sale to repair marketing.
- An import conflict leaves the existing order untouched. Keep the row staged with provenance for review. Repeating a source is not a mechanism for updating later operator capture.
- After any recovery, rerun company isolation, accepted revision totals, payment summaries, agenda versions and public lead/WhatsApp preparation. Record observed outcomes and residual differences before reopening writes.

Current status: local replay and synthetic persistence evidence exist; the real source, real target diff, restore rehearsal, operator acceptance and owner authorization do not. The production cutover is blocked and has not been executed.
