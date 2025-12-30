# 🏗️ CEJ Platform (Landing + SaaS)

**A hybrid Next.js platform combining a high-performance landing page with a scalable SaaS OS for concrete order management. UI language:** Spanish (all user-facing copy, labels, and messages).

---

## 1. Project Vision

**Concreto y Equipos de Juárez (CEJ) evolves into a digital-first platform:**

1. **CEJ Landing** (`/`) – Public conversion tool. High-speed, simplified wizard for visitors. Generates preliminary tickets and drives leads to WhatsApp.
2. **CEJ Cotizador** (`/cotizador`) – Internal sales tool. Expert-mode always on, designed for staff to generate formal PDF proposals and negotiate complex orders.
3. **CEJ Pro (SaaS Portal)** – Authenticated portal for contractors to review history, re-order, and eventually manage billing and operations.

The repository **`cej-landing`** is the single codebase that powers all three layers.

---

## 2. Architecture & Structure

We follow a **feature-first, component-folder** architecture, optimized for the Next.js App Router.

```text
cej-landing/
├── app/                         # Next.js App Router
│   ├── (marketing)/             # Public landing pages (/, /aviso-de-privacidad)
│   ├── (app)/                   # Functional tools (e.g. /cotizador)
│   └── actions/                 # Server Actions (e.g. submitLead)
├── components/
│   ├── Calculator/              # Quote wizard, summary, ticket, modals
│   ├── layouts/                 # Layouts (Header, Footer, GlobalUI)
│   ├── QuoteDrawer/             # Cart + quote drawer
│   └── ui/                      # Atoms (Button, Input, Card, etc.)
├── config/                      # Business rules, static content config
├── hooks/                       # Custom React hooks (useCheckoutUI, etc.)
├── lib/
│   ├── pricing.ts               # Core pricing engine
│   ├── tracking/                # Pixel + Meta CAPI + identity
│   ├── schemas/                 # Zod schemas for payloads and configs
│   └── monitoring.ts            # Error reporting helpers
├── store/                       # Zustand store (useCejStore)
├── styles/                      # SCSS modules + tokens + global styles
├── tests/                       # Vitest + Playwright tests (unit, integration, e2e)
└── types/                       # Shared TypeScript types

```

### Key Architectural Principles

- **Fail-Open:** Calculator and lead submission must still complete and open WhatsApp even if Supabase or tracking fail.
- **Strict Typing:** All critical paths (pricing, persistence, tracking) are typed and validated with Zod.
- **Global UI Shell:** Cart, quote drawer and feedback toasts are mounted globally so they survive route changes.
- **Mobile-First:** Layout and performance are optimized for low-end mobile devices first.
- **No Tailwind:** Styling is implemented via SCSS Modules and design tokens only.

For deeper details, see [`docs/ARCHITECTURE.md`].

---

## 3. Core Features

### 3.1 Landing & Calculator

- **Hero + Calculator:** Above-the-fold calculator entry with a clear promise and primary CTA (“Cotizar ahora”).
- **Wizard Flow:** Step-by-step form capturing:
  - Volume (m³)
  - Strength (`f'c`)
  - Concrete type
  - Zone / delivery conditions
- **Summary & Ticket:** Inline summary plus a ticket-style breakdown:
  - Base concrete
  - Additives (when expert mode is enabled)
  - Freight / surcharges
  - VAT
  - Total (MXN, formatted)

### 3.2 Cart & Quote Drawer

- Multi-item cart using a global Zustand store.
- **QuoteDrawer** surfaces current selection:
  - Accessible from the Smart Bottom Bar on mobile.
  - Always mounted via `GlobalUI` to avoid losing state.

### 3.3 Lead Submission & WhatsApp Handoff

- Lead data is validated and persisted (when DB available).
- WhatsApp link is always generated and opened, even when:
  - Supabase write fails,
  - Tracking endpoints fail.
- The WhatsApp prefill includes:
  - Quote summary,
  - Final total in MXN,
  - A lightweight meta description of the order.

### 3.4 Tracking & Marketing Ops

- Client-side Meta Pixel for `PageView`, `ViewContent`, and `Lead`.
- Server-side **Meta CAPI** for robust event delivery and deduplication.
- First-party identity cookies (`cej_vid`, `cej_sid`) for session/visitor tracking.
- JSON-LD schemas for SEO: **Product** and **OfferCatalog**.

### 3.5 Local Pro (Phase 4A – Completed)

Local SaaS experience without authentication:

- **Quote History:** Persisted locally via `useCejStore.history`.
- **Re-order Flow:** `loadQuote()` restores previous quotes.
- **Persistent Cart:** Survives page refreshes and route changes.

### 3.6 Cloud SaaS Portal (Phase 4B – In Progress)

> **Status:** Partially Implemented. Infrastructure for Auth and Dashboard is live.

- Supabase Auth (Magic Link). ✅
- `public.profiles` linked to `auth.users`. ✅
- `public.orders` for authenticated order history. ✅
- Dashboard with order list and “Reordenar” action. ✅
- Middleware protection for `/dashboard`. ✅
- Data sync to `price_config` as the primary pricing source. (Planned)

Full details: [`docs/PLAYBOOK_04_SAAS_PORTAL.md`].

---

## 4. Getting Started

### 4.1 Requirements

- Node.js (LTS)
- pnpm
- A Supabase project
- Meta Pixel + CAPI credentials

### 4.2 Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

By default, the app runs at `http://localhost:3000`.

### 4.3 Recommended Scripts

```bash
pnpm lint           # ESLint checks
pnpm test           # Vitest unit/integration tests
pnpm coverage       # Vitest + v8 coverage report
pnpm test:e2e       # Playwright e2e tests
pnpm build          # Production build
pnpm start          # Start production server
```

> Note: The e2e suite is designed to be safe for local development and CI. Future versions will add automated axe-core checks for accessibility.

---

## 5. Environment Variables

All environment variables are documented here for quick setup.

| Variable | Type | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical URL used in SEO and metadata. |
| `NEXT_PUBLIC_BRAND_NAME` | public | Brand name shown in titles and meta tags. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | public | WhatsApp number used in lead handoff (international format, e.g. `5216XXXXXXXXX`). |
| `NEXT_PUBLIC_PIXEL_ID` | public | Meta Pixel ID for browser tracking. |
| `FB_ACCESS_TOKEN` | secret | Meta CAPI access token for server-side events. |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase anon key used in client-side operations (RLS protected). |
| `SUPABASE_SERVICE_ROLE_KEY` | secret | Service role key used by Server Actions (bypasses RLS, must stay server-only). |

> Security: Never commit .env.local or any secret keys. All secret variables must be configured at the platform level (e.g. Vercel dashboard).

---

## 6. Environment Rules (Dev-Safe)

To minimize operational costs and keep analytics data clean, the application behaves differently based on the environment:

| Feature | local (Development) | preview (Staging) | production |
| --- | --- | --- | --- |
| **Cloudinary** | MOCKED (placehold.co) | MOCKED (placehold.co) | **REAL** |
| **Video Background** | DISABLED | DISABLED | **ENABLED** |
| **Google Analytics** | DISABLED | **ENABLED** (env: preview) | **ENABLED** (env: production) |
| **Meta Pixel** | DISABLED | **ENABLED** | **ENABLED** |

### How to test Cloudinary/Analytics locally?

If you absolutely need to test these features in `localhost`, you can temporarily force `isProd` in `config/env.ts` or set `NEXT_PUBLIC_VERCEL_ENV=production` in your `.env.local` (caution: this will consume Cloudinary credits).

---

## 7. Pricing Data (Phase 4 Prep)

The system supports **two pricing sources**:

1. **Local fallback:** `FALLBACK_PRICING_RULES` (JSON/TS configuration).
2. **Remote primary (planned):** `price_config` table in Supabase.

To seed `price_config` in Supabase:

```bash
# Ensure SUPABASE_SERVICE_ROLE_KEY is set
npx tsx scripts/seed-pricing.ts
```

If the database is unreachable or returns no rows, the calculator automatically falls back to local rules to preserve the user experience.

---

## 8. Testing

### 7.1 Unit & Integration (Vitest)

- Core math logic: `lib/pricing.ts`
- Store behavior: `store/useCejStore`
- Hooks: `hooks/useCheckoutUI`, `hooks/useQuoteCalculator`
- Utility functions: number parsing, MXN formatting, WhatsApp URL builder.

### 7.2 End-to-End (Playwright)

- Landing → Calculator → WhatsApp handoff.
- Multi-step wizard validation.
- QuoteDrawer and Smart Bottom Bar behavior.

### 7.3 Accessibility

- **Current:** Manual checks + High-contrast tokens.
- **Automated:** `axe-core` integration in CI (blocking on 'critical' violations).
- **Planned:** Full coverage for 'serious' violations and global reduced-motion support.

Details: [`docs/ACCESSIBILITY.md`].

---

## 9. Documentation

Main docs live under `/docs`:

### Technical

- [`docs/ROADMAP.md`](docs/ROADMAP.md) – Phases, sprints, and strategic direction.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) – High-level architecture, data flow, and key decisions.
- [`docs/DB_SCHEMA.md`](docs/DB_SCHEMA.md) – Tables, JSONB snapshots, and RLS.
- [`docs/PRICING_MODEL.md`](docs/PRICING_MODEL.md) – Pricing formulas and constraints.
- [`docs/TRACKING_GUIDE.md`](docs/TRACKING_GUIDE.md) – Pixel, CAPI, and analytics.
- [`docs/EXECUTION_GUIDE.md`](docs/EXECUTION_GUIDE.md) – Runbook for phases and releases.

### UX / UI

- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) – Tokens, layout, motion, and responsive behavior.
- [`docs/COMPONENT_LIBRARY.md`](docs/COMPONENT_LIBRARY.md) – UI components and props.
- [`docs/UX_STANDARDS.md`](docs/UX_STANDARDS.md) – User journeys, state machines, interaction patterns, and validation rules.
- [`docs/COPY_GUIDELINES.md`](docs/COPY_GUIDELINES.md) – All UI text, messages, and labels (Spanish).
- [`docs/ACCESSIBILITY.md`](docs/ACCESSIBILITY.md) – A11y patterns and testing.

### Playbooks

- [`docs/PLAYBOOK_04_SAAS_PORTAL.md`](docs/PLAYBOOK_04_SAAS_PORTAL.md) – Phase 4A (SaaS Portal) playbook (Planned).
- [`docs/archive/`](docs/archive/) – Archived playbooks for Phases 0–3.

### Agent Workflows

Standardized workflows for AI agents and developers in `.agent/workflows/`:

- [`code-review.md`](.agent/workflows/code-review.md) – Code review checklist for git diffs.
- [`documentation-audit.md`](.agent/workflows/documentation-audit.md) – Documentation structure and audit process.
- [`new-component.md`](.agent/workflows/new-component.md) – Template for creating React components.
- [`pre-commit.md`](.agent/workflows/pre-commit.md) – Pre-commit validation checklist.
- [`ux-copy-standards.md`](.agent/workflows/ux-copy-standards.md) – Spanish UI copy and validation patterns.

---

## 10. Contributing

### 9.1 Guidelines

- Write **TypeScript** everywhere (no `any` in core paths).
- Respect **UI in Spanish**: all user-facing labels, messages, and CTAs must remain in Spanish.
- Follow the **SCSS Modules + tokens** pattern (no inline styles except for dynamic coordinates).
- Before opening a PR:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm test:e2e` (optional locally, required in CI)

### 9.2 Branching

- `main` – Stable, deployable branch.
- Feature branches – Short-lived, squash-merged into `main` after passing CI.

See [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) for more operational details.

---

## 11. License

{TODO: business decision required – define and document project license (e.g., MIT, proprietary).}
