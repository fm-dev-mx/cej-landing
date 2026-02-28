# Prompt: System Consolidation & Implementation of Hardened Proxy v1

**Role:** You are a Senior Software Architect specializing in Next.js, Security, and Conversion Rate Optimization (CRO).

**Context:**
We have recently refactored the project's edge routing. The standard `middleware.ts` has been replaced by a hardened, authoritative routing engine located in `proxy.ts` (Commit: `d899507d34fd658cf47f24521adbbd1d3a125288`). Currently, the documentation in `.agents/plans/` and several implementation progress trackers still refer to "middleware," creating significant documentation drift.

**Objective:**

1. **Unify Documentation:** Synchronize all architectural plans with the new "Proxy" terminology.
2. **Harden Infrastructure:** Complete the P1/P2 priorities from the audit (CAPI Resilience, Store Splitting, and Layout Decoupling).

**High-Priority Tasks:**

1. **Global Documentation & Architectural Alignment (Next.js 16+ Standards):**
    * Perform a recursive search across `.agents/plans/` and update all references to "middleware" to "Proxy" or `proxy.ts` (consistent with Next.js 16 naming).
    * Verify that `proxy.ts` is the sole entry point for routing logic, eliminating any deprecated `middleware.ts` files or `middleware` function exports.
    * Check `next.config.ts` for any deprecated "middleware" flags (e.g., `skipMiddlewareUrlNormalize`) and update them to their "proxy" equivalents.
    * Update technical diagrams (Mermaid blocks) in `structure.md` and `01-architectural-audit.md` to reflect the Proxy as the central entry point.

2. **CAPI Robustness & Matching (P1):**
    * **Resilience:** Implement a `fetch` wrapper with **Exponential Backoff** (3 retries: 1s, 2s, 4s) and a 5s `timeout` in `lib/tracking/capi.ts`.
    * **Dead Letter Queue:** Create a `capi_dead_letters` table in Supabase via SQL and update `sendToMetaCAPI` to persist failed events there after exhausted retries.
    * **Normalization:** Update the phone hashing logic to strip non-numeric characters and ensure the `52` (Mexico) prefix is present before SHA-256 hashing.

3. **WhatsApp Conversion Reliability (P1):**
    * Implement `/api/track-contact/route.ts` as a server-side backup for the `Contact` event.
    * Update WhatsApp click handlers to trigger this endpoint using `fetch(..., { keepalive: true })` to ensure delivery during navigation.

4. **Architectural Bundle Decoupling (P2):**
    * **Layout Sanitization:** Move `AuthProvider` from the root `app/layout.tsx` to `app/(admin)/layout.tsx`. Move `GlobalUI` and the FB Pixel script to `app/(public)/layout.tsx`.
    * **Store Migration:** Finalize the transition from the monolithic `useCejStore` to the split stores (`usePublicStore` and `useAdminStore`). Ensure the administrative `ordersSlice` is physically absent from the public JS bundle.

5. **Route & Config Cleanup (P2):**
    * **Logic De-duplication:** Remove redundant `SECURE_HEADERS` and `withSecurityHeaders` logic from `proxy.ts`, relying on the centralized `next.config.ts` for security headers.
    * Delete the orphan `app/(app)/cotizador` directory.
    * Remove `placehold.co` from the `remotePatterns` in `next.config.ts`.

**Success Criteria:**

* **Documentation:** 100% alignment between `proxy.ts` implementation and `.agents/plans/`.
* **Performance:** The public landing page bundle must no longer include the Supabase Client SDK or administrative state slices.
* **Data Integrity:** Verified hash compliance for phone numbers and functional retry logic for Meta CAPI.

**Constraints:**

* Do not reinstall existing dependencies (use native `fetch`, `crypto`, and `node:crypto`).
* Follow the **ADU (Atomic/Discrete/Unit)** principle for all commits.
* Maintain the current functional logic of `proxy.ts` (allowlisting and security headers).
