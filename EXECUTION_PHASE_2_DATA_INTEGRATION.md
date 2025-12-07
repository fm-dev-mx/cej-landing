file: EXECUTION_PHASE_2_DATA_INTEGRATION.md
# EXECUTION_PHASE_2_DATA_INTEGRATION.md

## 1. Summary & Scope

Objective: Connect the application to Supabase to store leads persistently. We will replace the mock logic in `submitLead` with real database insertions using the "Fail-Open" strategy.

In-Scope: Supabase Client/Server setup, `leads` table implementation (JSONB Snapshot strategy), Server Action implementation, Error Handling.

Out-of-Scope: Dashboard, Admin Auth, relational `orders` normalization (reserved for Phase 3/4).

## 2. Dependencies

- Supabase Credentials in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- Existing `OrderSubmissionSchema` in `lib/schemas.ts`.

## 3. Task Plan (Checklist)

### 3.1. Infrastructure & Schema

- [ ]  **Env Validation:** Update `config/env.ts` to make Supabase keys required in production but optional in dev (warn if missing).
- [ ]  **Alignment with README:** Implement the **Audit Trail** requirement by storing the full `OrderPayload` into a `jsonb` column (`quote_data`) within the `leads` table. This serves as the "Backend Foundation" for anonymous users.

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

## 4. Definition of Done (DoD)

- Submitting a lead creates a record in Supabase `leads` table.
- The `quote_data` column contains the calculated breakdown (JSONB Snapshot).
- If `SUPABASE_SERVICE_ROLE_KEY` is invalid or DB is down, the user is **redirected to WhatsApp** seamlessly.
- `LeadFormModal` remembers the user's name/phone on page reload (via existing store logic).
