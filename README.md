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
cej-landing/
├── app/                     # Next.js App Router (Route Groups)
│   ├── (marketing)/         # Public landing pages (/, /aviso-de-privacidad)
│   ├── (app)/               # Functional tools (/cotizador)
│   └── actions/             # Server Actions (submitLead)
├── components/
│   ├── Calculator/          # Complex domain components (wizard, modals)
│   ├── layouts/             # Layout components (Header, Footer, GlobalUI)
│   └── ui/                  # UI atoms (Button, Input, Card)
├── config/                  # Business rules and content configuration
├── hooks/                   # Custom React hooks
├── lib/
│   ├── schemas/             # Zod validation schemas
│   ├── tracking/            # Meta CAPI, Pixel, identity management
│   └── pricing.ts           # Core pricing engine
├── store/                   # Zustand state management
├── styles/                  # SCSS tokens and global styles
└── types/                   # TypeScript type definitions
```

### Key Patterns

- **Fail-Open:** Lead submission keeps the UX flow even if DB write fails.
- **Global UI:** Cart state and overlays are mounted once in `components/layouts/GlobalUI`.
- **Strict Typing:** Database payloads and server actions are validated with Zod schemas.

### Component Overview

| **Directory** | **Purpose** |
| --- | --- |
| `Calculator/` | Multi-step quote wizard (24 files) |
| `layouts/` | Header, Footer, GlobalUI, HeroSection |
| `ui/` | Reusable atoms (Button, Input, Card, Modal) |
| `FAQ/`, `Services/` | Landing page sections |
| `QuoteDrawer/` | Cart sidebar |

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

### Technical Documentation

- [🗺️ **Roadmap & Sprints**](/docs/ROADMAP.md): Project phases, user roles, and execution plan.
- [🏗️ **Architecture**](/docs/ARCHITECTURE.md): Data flow diagrams, state management, and code conventions.
- [🗄️ **Database Schema**](/docs/DB_SCHEMA.md): Table definitions, JSONB snapshots, and RLS security policies.
- [📊 **Pricing Model**](/docs/PRICING_MODEL.md): Math logic, formulas, and business rules.
- [📈 **Tracking & SEO**](/docs/TRACKING_GUIDE.md): Meta CAPI, Pixel, and Analytics setup.
- [🚀 **Execution Guide**](/docs/EXECUTION_GUIDE.md): Standards and deployment protocol.

### UX/UI Documentation

- [🎨 **Design System**](/docs/DESIGN_SYSTEM.md): Tokens, motion, shadows, and responsive behavior.
- [🧩 **Component Library**](/docs/COMPONENT_LIBRARY.md): UI components, props, variants, and usage.
- [🔄 **Interaction Patterns**](/docs/INTERACTION_PATTERNS.md): Forms, validation, loading, and feedback.
- [🗺️ **UX Flows**](/docs/UX_FLOWS.md): User journeys, state machines, and flow diagrams.
- [📊 **UI States**](/docs/UI_STATES.md): Empty, error, loading, and success states.
- [🎯 **Iconography**](/docs/ICONOGRAPHY.md): Icon usage, sizing, and accessibility.
- [♿ **Accessibility**](/docs/ACCESSIBILITY.md): WCAG compliance, patterns, and testing.

### Playbooks

- [🏃 **Sprint 4: SaaS Portal**](/docs/PLAYBOOK_04_SAAS_PORTAL.md): Active development guide.
- [📁 **Archive**](/docs/archive/): Completed sprint playbooks (00-03).

## 5. Tech Stack

| **Technology** | **Version** | **Purpose** |
| --- | --- | --- |
| **Next.js** | 16.0.7 | App Router + Server Actions |
| **TypeScript** | 5.9.3 | Strict typing |
| **React** | 19.2.0 | UI Framework |
| **Supabase** | 2.87.1 | Postgres + Auth |
| **Zustand** | 5.0.9 | State management |
| **Zod** | 3.25.76 | Runtime validation |
| **SCSS Modules** | - | Design system tokens |
