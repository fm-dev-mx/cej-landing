# Step 00 — Meta Pixel & CAPI Quick Fixes

**Estimated effort:** ~1h
**Risk:** Low — server-only changes, no UI impact
**Blocks:** Steps 03 and 04 (which add new tracking calls)

---

## Implementation Progress

> **Last audited:** 2026-02-27 by Implementation Audit
> **Completion:** 88% (7/8 items — 0 partial)

| # | Item | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Read `META_TEST_EVENT_CODE` from env in CAPI payload | ✅ | `lib/tracking/capi.ts` |
| 2 | Add hashed `external_id` to Lead CAPI `user_data` | ✅ | `app/actions/submitLead.ts` |
| 3 | Add hashed `fn` (first-name token) to Lead CAPI `user_data` | ✅ | `app/actions/submitLead.ts` |
| 4 | Add `META_TEST_EVENT_CODE` to Zod env schema | ✅ | `config/env.ts` |
| 5 | Add `META_TEST_EVENT_CODE` to `processEnv` mapping | ✅ | `config/env.ts` |
| 6 | Add `META_TEST_EVENT_CODE` entry to `.env.local` and `.env.example` | ⬜ | Not found |
| 7 | Add CAPI tests for `test_event_code` toggle and network error branch | ✅ | `lib/tracking/capi.test.ts` |
| 8 | Add submitLead tests for `external_id`, `fn`, and missing `fb_event_id` behavior | ✅ | `app/actions/submitLead.test.ts` |

## Pre-conditions

- [ ] `pnpm test --run` passes on `main`
- [ ] `.env.local` has valid `FB_ACCESS_TOKEN` and `NEXT_PUBLIC_PIXEL_ID`

---

## Context

The previous technical audit (`meta_pixel_capi_audit.md`) identified two high-impact, low-risk gaps in the CAPI implementation:

1. **`external_id` missing from `user_data`** — the `cej_visitor_id` is collected, stored in Supabase, but never forwarded to Meta CAPI. This is the single highest-impact action for Event Match Quality (EMQ), estimated +1.5–2 points.
2. **`test_event_code` is hardcoded as a comment** — a developer comment in `capi.ts` that risks contaminating production metrics if accidentally uncommented. Must be controlled via environment variable.
3. **`fn` (first name) not hashed and sent** — `name` is available in the `submitLead` payload and can be split to extract the first name, which improves EMQ by ~0.5 points.

---

## Changes

### `lib/tracking/capi.ts`

**Goal:** Read `META_TEST_EVENT_CODE` from env instead of hardcoded comment.

```ts
// Before (risky):
// test_event_code: 'TEST20662' // Uncomment for debugging

// After (safe):
...(env.META_TEST_EVENT_CODE && { test_event_code: env.META_TEST_EVENT_CODE }),
```

- Add `META_TEST_EVENT_CODE?: string` to the env config schema.
- The field must be **server-only** (no `NEXT_PUBLIC_` prefix) so it never leaks to the browser bundle.

### `app/actions/submitLead.ts`

**Goal:** Add `external_id` and `fn` to the CAPI `user_data` block.

```ts
// Inside the after() block:
user_data: {
  client_ip_address: clientIp,
  client_user_agent: userAgent,
  ph: hashedPhone,
  em: hashedEmail,
  fbc,
  fbp,
  // NEW:
  external_id: hashData(visitor_id),           // SHA-256 of cej_visitor_id
  fn: hashData(name.split(' ')[0]),             // SHA-256 of first name token
},
```

- `hashData()` already handles `undefined` gracefully — no new error paths.
- `visitor_id` can be `undefined` (anonymous users). `hashData(undefined)` returns `undefined` — no change in behavior for anonymous leads.

### `.env.local` + `.env.example`

Add the new optional variable:
```bash
# Meta Events Manager — Test Event Code (dev/staging only, leave blank in production)
META_TEST_EVENT_CODE=
```

### `config/env.ts`

Two separate additions are required — **both must be made**:

1. Add to the **Zod `envSchema`** object (server-side, no default):
   ```ts
   META_TEST_EVENT_CODE: z.string().optional(),
   ```

2. Add to the **`processEnv` literal object** (lines 39–54 of the current file). This is a separate manual mapping that Zod reads from — forgetting this means Zod never sees the real env value:
   ```ts
   META_TEST_EVENT_CODE: process.env.META_TEST_EVENT_CODE,
   ```

> ⚠️ `config/env.ts` has two distinct parts: the Zod schema definition AND a `processEnv` literal that maps raw `process.env.*` values. Both must be updated for any new env variable.

---

## Tests to Write / Update

### `lib/tracking/capi.test.ts`

- [ ] **New:** `it('includes test_event_code when META_TEST_EVENT_CODE env is set')`
  - Mock `env.META_TEST_EVENT_CODE = 'TEST12345'`
  - Assert `JSON.parse(body).test_event_code === 'TEST12345'`
- [ ] **New:** `it('omits test_event_code when META_TEST_EVENT_CODE env is not set')`
  - Mock `env.META_TEST_EVENT_CODE = undefined`
  - Assert `JSON.parse(body).test_event_code` is `undefined`
- [ ] **New:** `it('handles fetch network error gracefully (catch branch)')`
  - Mock `global.fetch` to `vi.fn().mockRejectedValue(new Error('Network error'))`
  - Assert `reportError` is called; no throw propagates

### `app/actions/submitLead.test.ts`

- [ ] **New:** `it('sends hashed external_id when visitor_id is present')`
  - Assert `args.user_data.external_id` matches `/^[a-f0-9]{64}$/`
- [ ] **New:** `it('sends hashed fn from first name token')`
  - Payload `name: 'Juan Pérez'` → assert `args.user_data.fn` is SHA-256 of `'juan'`
- [ ] **New:** `it('does not call sendToMetaCAPI when fb_event_id is absent')`
  - Submit payload without `fb_event_id` → assert `sendToMetaCAPI` not called

---

## Commit

```
fix(tracking): add external_id and fn to CAPI user_data for EMQ improvement

- Hash cej_visitor_id as external_id in submitLead CAPI payload
- Hash first name token as fn
- Move test_event_code to META_TEST_EVENT_CODE env variable
- Add missing test cases: network error, test_event_code toggle, fn hashing
```

---

## Validation

```bash
pnpm lint && pnpm typecheck && pnpm test --run lib/tracking/capi.test.ts
pnpm test --run app/actions/submitLead.test.ts
```

Expected EMQ after this step: **~7.5–8 / 10**
