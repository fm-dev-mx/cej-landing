# EXECUTION_PHASE_4_MARKETING_OPS.md

## 1. Summary & Scope

Objective: Implement server-side tracking (Meta Conversion API) to solve iOS tracking limitations. Also, finalize SEO details for production.

In-Scope: CAPI Integration (Server-side), Event Deduplication, Sitemap finalization, Structured Data.

Out-of-Scope: UI Changes.

## 2. Dependencies

- Facebook Pixel ID & **Access Token**.
- Phase 2 (Server Actions) must be working.

## 3. Task Plan (Checklist)

### 3.1. Infrastructure & Secrets

- [ ]  **Update `config/env.ts`:** Add validation for `FB_ACCESS_TOKEN` (Server-side only). Ensure it is NOT exposed to the client via `NEXT_PUBLIC_`.

### 3.2. CAPI Integration

- [ ]  **Create `lib/tracking/capi.ts`:**
    - Helper function to send POST request to `https://graph.facebook.com/v19.0/{PIXEL_ID}/events`.
    - Implement user data hashing (SHA-256) for email and phone using the Token.
- [ ]  **Update `submitLead` Action:**
    - Receive `fb_event_id` and `fbp`/`fbc` cookies from the client payload.
    - Call `sendCapiEvent('Lead', ...)` *after* the DB insertion.
    - Ensure `event_id` matches the one sent by the Browser Pixel (deduplication).

### 3.3. SEO Refinement

- [ ]  **Update `app/layout.tsx`:** Verify `generateLocalBusinessSchema` populates with real data from `config/business.ts`.
- [ ]  **Dynamic Metadata:** Ensure `metadata` export in `page.tsx` uses the `BUSINESS_INFO` config dynamically.

## 4. Definition of Done (DoD)

- Submitting a lead triggers TWO events in Meta Events Manager (Browser & Server) with the same `event_id`.
- Meta reports "Deduplicated" status.
- `FB_ACCESS_TOKEN` is securely managed and validated.
- Lighthouse Performance score is >95 on Mobile.

## 5. Instructions for Prompting

```text
Act as a Marketing Technologist and Backend Dev. We are in PHASE 4.
Context: We need to implement Facebook CAPI inside the 'submitLead' Server Action.
1. Add 'FB_ACCESS_TOKEN' to 'config/env.ts' (Server-side only validation).
2. Create 'lib/tracking/capi.ts' to handle the Graph API request and data hashing.
3. Modify 'app/actions/submitLead.ts' to invoke CAPI using the token.
4. Ensure the 'event_id' generated in the client is passed correctly to the server for deduplication.
Output the env config update, CAPI utility, and the updated Server Action.
