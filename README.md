# 🏗️ CEJ Cotizador Platform

**Concreto y Equipos de Juárez (CEJ)** — Plataforma de cotización para constructores y contratistas en Ciudad Juárez.

A full-stack, mobile-first web application enabling users to estimate concrete costs, generate folios, and submit orders directly to WhatsApp — with a **Fail-Open resilience strategy** that guarantees the user flow completes even when backend services are unavailable.

---

## 🚀 Overview

The platform has evolved from a simple landing page into a multi-phase SaaS product:

- **Phase 1–3 (Complete):** Traffic capture, lead generation, Meta CAPI tracking, and a robust concrete cost calculator with expert mode.
- **Phase 4A (Complete):** Local quote history, persistent cart, multi-step checkout, and URL-based quote sharing.
- **Phase 4B (In Progress):** Supabase Auth (Magic Link), protected `/dashboard`, user order history.

For the full roadmap and sprint history see [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## 🧩 Core Features

### 🧱 Concrete Calculator

- Wizard and Expert modes (volume, strength, service type, additives).
- Transparent price breakdown with validation and real-time updates.
- Live pricing from Supabase with static `FALLBACK_PRICING_RULES` as fail-open.
- URL-based quote restore and persistent local cart.

### 💬 Checkout & Lead Capture

- Multi-step `SchedulingModal` with full form validation.
- **Fail-Open Checkout:** If backend fails, a local `OFFLINE-xxx` folio is generated and the WhatsApp handoff proceeds without interruption.
- `orderDispatcher` centralizes all submission logic.

### 📊 Hybrid Tracking (Browser + Server)

- Meta Pixel (browser) + Meta CAPI (server-side) with SHA-256 PII hashing.
- Shared `event_id` for deduplication across both channels.
- Google Analytics 4 via `NEXT_PUBLIC_GA_ID`.
- UTM attribution persisted via `sessionStorage` and attached to the lead payload.

### 🔐 Auth & Dashboard (Phase 4B)

- Supabase Auth with Magic Link.
- Server-side session refresh via Next.js Middleware.
- Protected `/dashboard` route with order history.

---

## 🛠️ Stack

| Layer           | Technology                       | Purpose                                          |
| --------------- | -------------------------------- | ------------------------------------------------ |
| Framework       | **Next.js 16 (App Router)**      | SSR, Server Actions, Middleware                  |
| Language        | **TypeScript 5.9**               | Strict typing across all layers                  |
| State           | **Zustand 5 (Slices)**           | `calculatorSlice`, `cartSlice`, `ordersSlice`    |
| Styling         | **SCSS Modules + Design Tokens** | `_tokens.scss`, `_primitives.scss`               |
| Backend         | **Supabase (Postgres + Auth)**   | Leads, Orders, Pricing, Auth                     |
| Validation      | **Zod**                          | Schema-first validation across Client and Server |
| Tracking        | **Meta Pixel + CAPI + GA4**      | Hybrid conversion tracking                       |
| Package Manager | **pnpm**                         | Fast, deterministic installs                     |
| Hosting         | **Vercel**                       | Zero-config deployment                           |
| Unit Tests      | **Vitest + Testing Library**     | Component and hook coverage                      |
| E2E Tests       | **Playwright**                   | Full quote-flow, checkout, auth coverage         |

---

## 🧱 Project Structure

```
cej-landing/
├─ app/               # Next.js App Router (routes, layouts, server actions)
├─ components/
│  ├─ Calculator/     # Multi-step wizard, expert mode, modals, ticket
│  ├─ QuoteDrawer/    # Cart drawer with multi-item summary
│  ├─ layouts/        # Header, Footer, HeroSection, GlobalUI
│  └─ ui/             # Design system primitives (Button, Input, Select, …)
├─ config/
│  ├─ business.ts     # Pricing rules, additives, business config
│  ├─ content.ts      # Marketing copy and section content
│  └─ env.ts          # Zod-validated environment variables (single source of truth)
├─ docs/              # Architecture, ADRs, design system, roadmap
├─ hooks/             # useQuoteCalculator, useCheckoutUI, useCalculatorUI
├─ lib/
│  ├─ logic/          # orderDispatcher (centralized submission)
│  ├─ tracking/       # capi.ts, visitor.ts, utm.ts
│  ├─ schemas/        # Zod schemas (calculator, orders, pricing)
│  ├─ supabase/       # client.ts (browser) + server.ts (SSR)
│  └─ utils.ts        # Shared helpers
├─ scripts/           # DB seeding (seed-leads.ts, seed-pricing.ts)
├─ store/
│  ├─ slices/         # calculatorSlice, cartSlice, ordersSlice, uiSlice, userSlice
│  └─ useCejStore.ts  # Zustand store with persist middleware
├─ styles/            # globals.scss, _tokens.scss, _primitives.scss
├─ tests/             # Playwright E2E specs
├─ types/
│  ├─ domain.ts       # Core domain types (QuoteBreakdown, Order, Lead)
│  └─ database.ts     # Supabase auto-generated DB types
└─ vitest.config.mts
```

---

## ⚙️ Environment Variables

Create `.env.local` at the project root. Use `.env.example` as a template.
All variables are validated at startup via `config/env.ts` (Zod schema).

| Variable                        | Scope  | Required    | Description                                   |
| ------------------------------- | ------ | ----------- | --------------------------------------------- |
| `NEXT_PUBLIC_PIXEL_ID`          | Public | Yes         | Meta Pixel ID for browser tracking            |
| `FB_ACCESS_TOKEN`               | Server | Yes         | Meta System User Token for CAPI events        |
| `NEXT_PUBLIC_GA_ID`             | Public | Recommended | Google Analytics 4 Measurement ID             |
| `NEXT_PUBLIC_WHATSAPP_NUMBER`   | Public | Yes         | WhatsApp number (E.164, no `+`)               |
| `NEXT_PUBLIC_PHONE`             | Public | No          | Optional phone CTA number                     |
| `NEXT_PUBLIC_SITE_URL`          | Public | Yes         | Canonical base URL (no trailing slash)        |
| `NEXT_LOCAL_SITE_URL`           | Server | Dev only    | Local dev base URL (`http://localhost:3000`)  |
| `NEXT_PUBLIC_BRAND_NAME`        | Public | No          | Brand name used in SEO metadata               |
| `NEXT_PUBLIC_CURRENCY`          | Public | No          | Currency code (default: `MXN`)                |
| `NEXT_PUBLIC_SUPABASE_URL`      | Public | Yes\*       | Supabase project URL                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Yes\*       | Supabase anon/public key for browser client   |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server | Yes\*       | Supabase service role key for Server Actions  |
| `MONITORING_WEBHOOK_URL`        | Server | No          | Slack/webhook URL for system error alerts     |
| `ENABLE_E2E_MOCKS`              | Server | Dev only    | Set to `true` to enable Playwright mock modes |

> \* If Supabase keys are absent, the app starts in **Fail-Open mode**: local folios are generated and WhatsApp handoff works, but orders will not be persisted to the database.

---

## 🧠 Scripts

| Command               | Description                                 |
| --------------------- | ------------------------------------------- |
| `pnpm dev`            | Development server (Next.js with Turbopack) |
| `pnpm build`          | Production build                            |
| `pnpm start`          | Serve production build locally              |
| `pnpm lint`           | ESLint (static analysis + type-aware rules) |
| `pnpm test`           | Vitest unit/integration tests (single run)  |
| `pnpm test:watch`     | Vitest in watch mode                        |
| `pnpm coverage`       | Vitest with coverage report                 |
| `npx playwright test` | Playwright E2E test suite                   |

---

## 🧾 Deployment

### Vercel (recommended)

1. Push this repository to GitHub.
2. Connect it to [Vercel](https://vercel.com).
3. Add all environment variables from the table above in **Project Settings → Environment Variables**.
4. Deploy 🚀.

> **Note:** The app runs in Fail-Open mode if Supabase keys are not configured. All UX flows remain functional, but persistence and CAPI tracking will be disabled.

---

## 📐 Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full system diagram, Fail-Open sequence, and component lifecycle.

See [`docs/TRACKING_GUIDE.md`](docs/TRACKING_GUIDE.md) for the Pixel + CAPI hybrid tracking architecture.

---

## 👤 Author

**Francisco Mendoza**
Full-stack developer & marketing automation specialist
[fm-dev-mx](https://github.com/fm-dev-mx)

---

## 📄 License

This project is licensed under the **MIT License**.
See the [LICENSE](LICENSE) file for details.
