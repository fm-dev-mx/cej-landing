# 05 — Compliance Checklist: Verification & Launch

> **Blueprint:** v1-conversion-redesign
> **Last Updated:** 2026-02-27
> **Status:** Draft — Pending Review

---

## 1. Middleware & Route Protection

### 1.1 Route Security

| # | Check | Verification Method | Pass Criteria |
|:--|:------|:-------------------|:-------------|
| R1 | `middleware.ts` exists at project root | File exists check | File present and exported |
| R2 | Unauthenticated access to `/dashboard` redirects to `/login` | Manual test: open `/dashboard` in incognito browser | HTTP 307 → `/login` |
| R3 | Unauthenticated access to `/dashboard/new` redirects | Manual test: open `/dashboard/new` in incognito | HTTP 307 → `/login` |
| R4 | Authenticated access to `/dashboard` renders page | Login → navigate to `/dashboard` | Dashboard renders with user greeting |
| R5 | Non-existent routes return 404 | Manual test: open `/nonexistent` | Next.js 404 page |
| R6 | Auth callback route works | Complete login flow | Redirect to `/dashboard` after Supabase callback |
| R7 | Public routes accessible without auth | Open `/` in incognito | Landing page renders fully |
| R8 | Public routes don't trigger auth session check | Network tab inspection on `/` | No Supabase auth requests |

### 1.2 Bundle Isolation

| # | Check | Verification Method | Pass Criteria |
|:--|:------|:-------------------|:-------------|
| B1 | `AuthProvider` not in public bundle | `pnpm build` → inspect `.next/server/app/(public)/page.js` | No Supabase imports |
| B2 | `ordersSlice` not in public bundle | Webpack bundle analyzer or grep built chunks | No `ordersSlice` reference |
| B3 | Dashboard components not preloaded | Network tab on `/` | No dashboard chunks downloaded |
| B4 | `GlobalUI` only in `(public)` layout | Check `(admin)/layout.tsx` | No `GlobalUI` import |

---

## 2. CAPI & Tracking Validation

### 2.1 Payload Integrity

| # | Check | Verification Method | Pass Criteria |
|:--|:------|:-------------------|:-------------|
| T1 | `event_id` sent to both Pixel and CAPI | Console log + Vercel logs for `submitLead` | Same UUID in both |
| T2 | `_fbp` cookie captured in CAPI payload | Log CAPI payload in test mode | `fbp` field non-null when cookie exists |
| T3 | `_fbc` cookie captured in CAPI payload | Visit with `?fbclid=test123` → submit lead | `fbc` field contains `fb.1.{timestamp}.test123` |
| T4 | Phone hashed correctly (SHA-256) | Unit test: `hashData('6561234567')` | Matches expected SHA-256 hash |
| T5 | Phone normalized before hashing | Unit test: `normalizePhone('+52 656 123 4567')` | Returns `526561234567` |
| T6 | `client_ip_address` extracted from headers | Log CAPI payload | Non-empty, valid IP format |
| T7 | `event_source_url` is the page URL | Log CAPI payload | Matches `referer` header |
| T8 | `event_time` is within 5 seconds of submission | Compare CAPI timestamp to server time | Delta < 5s |

### 2.2 Event Deduplication

| # | Check | Verification Method | Pass Criteria |
|:--|:------|:-------------------|:-------------|
| D1 | Lead event fires on both Pixel and CAPI | Meta Events Manager → Test Events | Both events show, one is deduped |
| D2 | Contact event fires for WhatsApp click | Click WhatsApp CTA → check Events Manager | `Contact` event appears |
| D3 | `Contact` CAPI endpoint responds | `curl -X POST /api/track-contact` | HTTP 200 + `{ ok: true }` |
| D4 | Duplicate events are collapsed in Meta | Submit same `event_id` twice | Events Manager shows count = 1 |

### 2.3 Retry & Dead Letter Queue

| # | Check | Verification Method | Pass Criteria |
|:--|:------|:-------------------|:-------------|
| Q1 | CAPI retries on 5xx | Mock Meta API to return 500 → 500 → 200 | Event delivered on 3rd attempt |
| Q2 | CAPI does NOT retry on 4xx | Mock Meta API to return 400 | Only 1 attempt, error logged |
| Q3 | Failed events written to `capi_dead_letters` | Mock Meta API to return 500 × 4 | Record in `capi_dead_letters` table |
| Q4 | Dead letter has correct payload | Query `capi_dead_letters` | `payload` matches original CAPI event |

### 2.4 UTM Attribution

| # | Check | Verification Method | Pass Criteria |
|:--|:------|:-------------------|:-------------|
| U1 | UTM params captured from URL | Visit `/?utm_source=facebook&utm_medium=cpc` | Cookie `cej_utm` set with values |
| U2 | UTM params persist across pages | Navigate to `/aviso-de-privacidad` | Cookie still present |
| U3 | UTM params sent in lead submission | Submit lead → check Supabase `leads` table | `utm_source` = `facebook` |
| U4 | `fbclid` sets `_fbc` cookie via middleware | Visit `/?fbclid=ABC123` | `_fbc` cookie = `fb.1.{ts}.ABC123` |
| U5 | No duplicate UTM systems | Codebase search for `localStorage` UTM keys | Only cookie-based system exists |

---

## 3. Core Web Vitals

### 3.1 Performance Thresholds

| Metric | Target | Tool | Measurement URL |
|:-------|:-------|:-----|:----------------|
| **LCP** (Largest Contentful Paint) | < **2.5s** | Lighthouse, PageSpeed Insights | `/` (mobile, 4G throttled) |
| **CLS** (Cumulative Layout Shift) | < **0.1** | Lighthouse | `/` (mobile) |
| **INP** (Interaction to Next Paint) | < **200ms** | Chrome DevTools Performance | Calculator interaction |
| **FCP** (First Contentful Paint) | < **1.8s** | Lighthouse | `/` (mobile) |
| **TTFB** (Time to First Byte) | < **800ms** | WebPageTest | `/` (CDN edge) |
| **Total JS bundle** (public routes) | < **150KB** (gzipped) | `next build` output | `(public)` route group |

### 3.2 LCP Optimization Checklist

| # | Check | Verification | Pass |
|:--|:------|:-------------|:-----|
| L1 | Hero image uses `priority` prop | Code review | `<Image priority>` on hero |
| L2 | Fonts preloaded (Inter) | `next/font` auto-handles | No FOUT observed |
| L3 | No render-blocking third-party scripts | Network waterfall | GA/Pixel use `afterInteractive` |
| L4 | No unused Supabase SDK on public pages | Bundle analysis | Supabase not in `(public)` chunks |
| L5 | Critical CSS inlined | Next.js automatic | Verified via Lighthouse |

### 3.3 CLS Prevention Checklist

| # | Check | Verification | Pass |
|:--|:------|:-------------|:-----|
| C1 | All images have explicit `width` + `height` | Code review | No missing dimensions |
| C2 | Font display: `swap` configured | `next/font` config | `display: 'swap'` |
| C3 | SmartBottomBar has reserved space | CSS review | Fixed height, `position: fixed` |
| C4 | No dynamically injected content above fold | Visual check on slow 3G | No shift observed |

---

## 4. Security Audit

### 4.1 Headers & Transport

| # | Check | Verification Method | Pass Criteria |
|:--|:------|:-------------------|:-------------|
| S1 | `X-Frame-Options: DENY` | `curl -I https://concretodejuarez.com` | Header present |
| S2 | `X-Content-Type-Options: nosniff` | Same as S1 | Header present |
| S3 | `Referrer-Policy: strict-origin-when-cross-origin` | Same as S1 | Header present |
| S4 | `Permissions-Policy` restricts camera/mic/geo | Same as S1 | Header present |
| S5 | HTTPS enforced (HSTS) | Vercel auto-provides | Redirect HTTP → HTTPS |
| S6 | No `placehold.co` in production images | `grep -r "placehold.co" components/` | Zero results |

### 4.2 Form Security

| # | Check | Verification Method | Pass Criteria |
|:--|:------|:-------------------|:-------------|
| F1 | CSRF protection on `submitLead` | Server Actions have built-in CSRF (Next.js) | N/A (automatic) |
| F2 | Input sanitization via Zod | Code review of `OrderSubmissionSchema` | All fields validated |
| F3 | Rate limiting on lead submission | Implement middleware or API route rate limit | Max 5 submissions per IP per minute |
| F4 | Phone format validated server-side | Submit malformed phone via direct POST | Returns validation error |
| F5 | XSS prevention in user inputs | Submit `<script>alert(1)</script>` as name | Escaped in DB + UI rendering |
| F6 | `privacy_accepted` is required | Submit with `privacy_accepted: false` | Returns validation error |

### 4.3 Authentication Security

| # | Check | Verification Method | Pass Criteria |
|:--|:------|:-------------------|:-------------|
| A1 | Session cookies are HTTP-only | Browser DevTools → Application → Cookies | `HttpOnly` flag set |
| A2 | Session cookies have `SameSite=Lax` | Same as A1 | `SameSite` = Lax |
| A3 | Session cookies have `Secure` flag | Same as A1 | `Secure` flag set (production) |
| A4 | Logout clears all session data | Logout → check cookies | Session cookies removed |
| A5 | Token refresh works in middleware | Stay on dashboard for > session TTL | No forced logout |

### 4.4 API & Data Security

| # | Check | Verification Method | Pass Criteria |
|:--|:------|:-------------------|:-------------|
| P1 | `SUPABASE_SERVICE_ROLE_KEY` not in client bundle | `grep` build output | Key absent from all client chunks |
| P2 | `FB_ACCESS_TOKEN` not in client bundle | Same as P1 | Key absent |
| P3 | Store not exposed in production | `window.useCejStore` in production console | Returns `undefined` |
| P4 | `noindex, nofollow` on dashboard pages | View page source of `/dashboard` | Meta robots tag present |
| P5 | `noindex, nofollow` on shared quote pages | View source of `/cotizacion/[folio]` | Meta robots tag present |

---

## 5. Accessibility (a11y)

| # | Check | Verification Method | Pass Criteria |
|:--|:------|:-------------------|:-------------|
| X1 | Skip link present on public pages | Tab key on `/` | Skip link focuses `#main-content` |
| X2 | All form inputs have visible labels | Visual + code review | `<label>` elements present |
| X3 | Error messages use `role="alert"` | Screen reader test | Errors announced automatically |
| X4 | CTA buttons have min 44×44px touch targets | Chrome DevTools element inspection | All CTAs meet AAA target size |
| X5 | Color contrast ratio ≥ 4.5:1 (text) | Lighthouse a11y audit | Score ≥ 95 |
| X6 | Form inputs have `aria-invalid` on error | Submit empty form → inspect DOM | `aria-invalid="true"` present |

---

## 6. Pre-Launch Verification Commands

```bash
# 1. Lint & Type Check
pnpm lint
pnpm typecheck

# 2. Unit Tests
pnpm test

# 3. Build (verifies no compile errors + bundle size)
pnpm build

# 4. E2E Tests
pnpm test:e2e

# 5. Security Header Check (after deployment to preview)
curl -sI https://preview.concretodejuarez.com | grep -E "X-Frame|X-Content|Referrer|Permissions"

# 6. Lighthouse Performance Audit (requires Chrome)
# Run in Chrome DevTools → Lighthouse → Mobile → Performance
# Target: Performance ≥ 90, Accessibility ≥ 95

# 7. Meta Events Manager Validation
# Navigate to Events Manager → Test Events → use META_TEST_EVENT_CODE
# Submit a test lead → verify Lead event appears with correct dedup
```
