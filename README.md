# 🏗️ CEJ Platform (Landing + SaaS)

**A hybrid Next.js platform combining a high-performance landing page with a scalable SaaS OS for concrete order management.**

---

## 1. Project Vision

**Concreto y Equipos de Juárez (CEJ) evolves into a digital-first platform:**

1. **Lead Generation:** Friction-free calculator for anonymous traffic.
2. **Order Management:** “CEJ Pro” SaaS for contractors.

---

## 2. Architecture & Structure

We follow a strict **Feature-First** and **Component-Folder** architecture.

```text
src/
├── app/                 # Next.js App Router
├── components/
│   ├── Calculator/      # Complex domain components
│   ├── layouts/         # Layout components (Header, GlobalUI)
│   └── ui/              # UI atoms
├── hooks/               # Custom hooks
├── lib/
│   ├── schemas/         # Zod definitions
│   └── pricing.ts       # Core pricing engine
└── store/               # Zustand state
```

### Key Patterns

- **Fail-Open:** Lead submission keeps the UX flow even if DB write fails.
- **Global UI:** Cart state and overlays are mounted once in `components/layouts/GlobalUI`.
- **Strict Typing:** Database payloads and server actions are validated with Zod schemas.

---

## 3. Quick Start

### Installation

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

### Environment Variables (Detailed)

Required keys for the application to function correctly.

| **Variable** | **Description** |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for SEO and Metadata. |
| `NEXT_PUBLIC_BRAND_NAME` | Used in page titles and default SEO. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Target number for lead handoff (format: 521...). |
| `NEXT_PUBLIC_PIXEL_ID` | Meta Pixel ID for browser tracking. |
| `FB_ACCESS_TOKEN` | Meta CAPI Token (Server-side tracking). |
| `NEXT_PUBLIC_SUPABASE_URL` | API URL for your Supabase project. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key for client-side fetches (RLS protected). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** key for Server Actions (Bypasses RLS). |

### Seeding Pricing Data (Phase 4 Prep)

To populate the `price_config` table in Supabase with the initial pricing matrix:

```bash
# Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local
npx tsx scripts/seed-pricing.ts
```

> Note: The application currently defaults to FALLBACK_PRICING_RULES (local file) if the database connection fails or returns no data. This ensures high availability.
>

---

## 4. Documentation

For detailed architecture, database schemas, and the development roadmap, please refer to the `/docs` directory:

- [🗺️ **Roadmap & Sprints**](/docs/ROADMAP.md): Project phases, user roles, and execution plan.
- [🏗️ **Architecture**](/docs/ARCHITECTURE.md): Data flow diagrams, state management, and code conventions.
- [🗄️ **Database Schema**](/docs/DB_SCHEMA.md): Table definitions, JSONB snapshots, and RLS security policies.
- [🎨 **Design System**](/docs/DESIGN_SYSTEM.md): Component tokens, SCSS variables, and component styles.
- [📘 **Playbooks**](/docs/): Active execution guides (Older phases in `/docs/archive/`).
- [📊 **Pricing Model**](/docs/PRICING_MODEL.md): Math logic, formulas, and business rules.
- [📈 **Tracking & SEO**](/docs/TRACKING_GUIDE.md): Meta CAPI, Pixel, and Analytics setup.
- [🚀 **Execution Guide**](/docs/EXECUTION_GUIDE.md): Standards and deployment protocol.

---

## 5. Tech Stack

- **Next.js 16** (App Router + Server Actions)
- **TypeScript 5.9**
- **Supabase** (Postgres + Auth)
- **Zustand** (State management)
- **SCSS Modules** (Design system tokens & components)
