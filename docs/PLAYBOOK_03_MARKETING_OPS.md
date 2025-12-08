# Playbook 03: Marketing Ops (CAPI & SEO)

**Status:** Parallel Execution
**Context:** Solving iOS tracking data loss and improving SEO visibility.

## 1. Facebook CAPI (Server-Side Tracking)

To achieve a "High Match Quality" score in Meta, we must deduplicate events using a shared `event_id`.

### 1.1 The Deduplication Flow

1. **Client (`useCheckOut.ts`):**
    - Generate `const eventId = crypto.randomUUID()`.
    - Fire Pixel: `fbq('track', 'Lead', { ..., eventID: eventId })`.
    - Pass `eventId` and `fbp` cookie (from `document.cookie`) to `submitLead`.
2. **Server (`submitLead.ts`):**
    - Save `eventId` to DB.
    - **AFTER** DB insert, call CAPI helper.

### 1.2 CAPI Implementation details

- **File:** `lib/tracking/capi.ts`
- **Security:** Use `FB_ACCESS_TOKEN` (Server-Side Env Variable).
- **Hashing:** You **MUST** SHA-256 hash PII (Email, Phone) before sending to Meta. Normalizing (lowercase, trim) is required before hashing.
- **Reliability (Critical):**
    - Next.js Server Actions can terminate quickly.
    - Use `waitUntil` (if available in your hosting environment) or ensure the `await` for CAPI has a short timeout (e.g., 1000ms) to avoid hanging the UI. **Do not let a CAPI timeout fail the user request.**

### 1.3 [Schema.org](http://schema.org/) Expansion

- **File:** `lib/seo.ts`
- **Action:** Update `generateLocalBusinessSchema` to include:
    - `"hasOfferCatalog"`: List standard concrete types (f'c 200, 250).
    - `"areaServed"`: Explicitly list "Ciudad Juárez", "Samalayuca", "El Paso" (if applicable).

## 2. Exit Criteria

1. **Meta Events Manager:** Verify "Lead" event shows "Connection Method: Browser & Server" and **Status: Deduplicated**.
2. **Security:** `FB_ACCESS_TOKEN` is not present in the client-side bundle.
3. **SEO:** Google Rich Results Test shows valid "LocalBusiness" and "Product/Service" schemas.`
