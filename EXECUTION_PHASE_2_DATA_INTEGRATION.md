# EXECUTION_PHASE_2_DATA_INTEGRATION.md

## 1. Summary & Scope

Objective: Connect the application to Supabase to store leads persistently. We will replace the mock logic in submitLead with real database insertions using the "Fail-Open" strategy.

In-Scope: Supabase Client/Server setup, leads table mapping, Server Action implementation, Error Handling.

Out-of-Scope: Dashboard, Admin Auth, Offline Retry Queue (localStorage complexity).

## 2. Dependencies

- Supabase Credentials in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- Existing `OrderSubmissionSchema` in `lib/schemas.ts`.

## 3. Task Plan (Checklist)

### 3.1. Infrastructure & Schema

- [ ]  **Env Validation:** Update `config/env.ts` to make Supabase keys required in production but optional in dev (warn if missing).
- [ ]  **Schema Update:** Verify `lib/schemas.ts`. Ensure `OrderSubmissionSchema` matches the Supabase DB structure:
    - `quote`: Should be `Json` type (store the full `OrderPayload`).
    - `metadata`: Ensure it captures `userAgent` and `landingPage`.

### 3.2. Server Action Implementation

- [ ]  **Update `app/actions/submitLead.ts`:**
    - Initialize `createClient` inside the action context.
    - Implement `supabase.from('leads').insert(...)`.
    - **Crucial:** Wrap in `try/catch`. If Supabase throws, log the error but return `success: true` (with a `warning: 'db_down'` flag) to the client.

### 3.3. Client-Side Resilience

- [ ]  **Update `hooks/useCheckOut.ts`:**
    - Receive the result from `submitLead`.
    - If `result.warning` exists, log it to console/analytics.
    - **Do not block:** Proceed immediately to generate the WhatsApp link and clear the cart.
    - *Optimization:* Remove any complex localStorage retry logic for this phase to ensure MVP stability.

### 3.4. Identity Sync

- [ ]  **Enhance `updateUserContact` in Store:** Ensure that when a user submits a lead, their contact info is synced to `localStorage` immediately so `LeadFormModal` pre-fills next time.

## 4. Definition of Done (DoD)

- Submitting a lead creates a record in Supabase.
- The `quote_data` column in DB contains the calculated breakdown.
- If `SUPABASE_SERVICE_ROLE_KEY` is invalid or DB is down, the user is **redirected to WhatsApp** seamlessly.
- `LeadFormModal` remembers the user's name/phone on page reload.

## 5. Instructions for Prompting

```text
Act as a Backend-for-Frontend Developer. We are in PHASE 2.
Context: We are integrating Supabase into the Next.js Server Action.
1. Modify 'config/env.ts' to validate Supabase keys.
2. Refactor 'app/actions/submitLead.ts'. Use the 'OrderSubmissionSchema' to validate input. Insert into table 'leads'.
3. Implement a 'Fail-Open' strategy: If the DB insert fails, catch the error, console.error it, but return { success: true, warning: 'offline_mode' } so the client flow continues.
4. Update 'hooks/useCheckOut.ts' to handle this response (log warning, then redirect).
Constraint: Do NOT create API Routes (`pages/api`). Keep all logic inside the Server Action.
Output the modified files.
