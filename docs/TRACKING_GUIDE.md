# Tracking & Analytics Architecture

**Status:** Live Technical Reference
**Scope:** Meta CAPI, Pixel, SEO, and Attribution.

## 1. Hybrid Tracking Architecture (Browser + Server)

To ensure maximum data reliability (especially with iOS 14.5+ restrictions), we utilize a hybrid tracking model for conversion events.

### 1.1 Event Deduplication Strategy

We send the "Lead" event from both the Browser (Pixel) and the Server (CAPI).
To prevent Meta from counting them twice, we use a shared **Deduplication Key (`event_id`)**.

1. **Client-Side Generation:**
    Inside `useCheckoutUI.ts`, before submission, we generate a UUID v4:

    ```typescript
    const eventId = crypto.randomUUID();
    ```

2. **Browser Event:**
    We fire the pixel immediately:

    ```typescript
    fbq('track', 'Lead', { ...payload }, { eventID: eventId });
    ```

3. **Server Handoff:**
    The `eventId` is included in the `OrderSubmission` payload sent to `submitLead` Server Action.

4. **Server Event (CAPI):**
    After persisting the lead in Supabase, we fire the CAPI event using the **same** `event_id`.

### 1.2 Meta CAPI Implementation

- **Location:** `lib/tracking/capi.ts`
- **Trigger:** Asynchronous `next/server/after` task in `submitLead.ts`.
- **PII Hashing:** All Personal Identifiable Information (Phone, Email) is normalized (trimmed, lowercase) and hashed using **SHA-256** before transmission.
- **User Data Keys:**
  - `client_ip_address`: Extracted from `x-forwarded-for`.
  - `client_user_agent`: Extracted from request headers.
  - `fbp` / `fbc`: Extracted from cookies (critical for attribution).

## 2. SEO & Structured Data

We use JSON-LD (Schema.org) to enhance rich snippets in Google Search Results.

- **Generator:** `lib/seo.ts`
- **Component:** `app/layout.tsx` (injects `<script type="application/ld+json">`).

### Implemented Schemas

1. **LocalBusiness:** Defines the physical location, opening hours, and geo-coordinates of "Concreto y Equipos".
2. **OfferCatalog:** Explicitly lists the services available.

    - *Example:*

    ```json
        {
        "@type": "OfferCatalog",
        "name": "Servicios de Concreto",
        "itemListElement": [
            {
            "@type": "Offer",
            "itemOffered": {
                "@type": "Service",
                "name": "Concreto f'c 200 (Tiro Directo)"
            }
            }
        ]
        }
    ```

3. **Product:** Dynamic generation for pricing pages (future expansion).

## 3. UTM & Attribution Handling

Visitor sources are tracked to measure campaign performance.

- **Persistence:** `lib/tracking/visitor.ts`
- **Mechanism:**
    1. Middleware or Client Hook captures `utm_source`, `utm_medium`, `utm_campaign` from the URL search params.
    2. Values are stored in `sessionStorage` or Cookies.
    3. Values are attached to the `quote.metadata` object during checkout.
    4. Saved to `leads` table columns in Supabase.
