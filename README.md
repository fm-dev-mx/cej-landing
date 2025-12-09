# 🏗️ CEJ Platform (Landing + SaaS)

**A hybrid Next.js platform combining a high-performance landing page with a scalable SaaS OS for concrete order management.**

---

## 1. Project Vision

**Concreto y Equipos de Juárez (CEJ)** evolves into a digital-first platform:

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
│   │   ├── Forms/       # Reusable sub-forms (flattened)
│   │   └── Steps/       # Logical wizard steps
│   ├── layouts/         # Layout components (Header, GlobalUI, ToolShell)
│   └── ui/              # UI atoms (Button, Input, Select, etc.)
├── hooks/               # Custom hooks (checkout, quote engine, identity)
├── lib/
│   ├── schemas/         # Zod definitions (orders, calculator, pricing)
│   └── pricing.ts       # Core pricing engine
└── store/               # Zustand state (cart, drafts, user)
````

### Key Patterns

* **Fail-Open:** Lead submission keeps the UX flow even if DB write fails (`submitLead`).
* **Global UI:** Cart state and overlays are mounted once in `components/layouts/GlobalUI`.
* **Strict Typing:** Database payloads and server actions are validated with Zod schemas.

---

## 3. Quick Start

### Installation

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

### Environment Variables (essential)

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_BRAND_NAME=
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_PIXEL_ID=
NEXT_PUBLIC_GA_ID=

NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### Seeding Pricing Data

To populate the `price_config` table in Supabase:

```bash
# Ensure env vars are set
npx tsx scripts/seed-pricing.ts
```

---

## 4. Documentation

For detailed architecture, database schemas, and the development roadmap, please refer to the `/docs` directory:

-   [🗺️ **Roadmap & Sprints**](/docs/ROADMAP.md): Project phases, user roles, and execution plan.
-   [🏗️ **Architecture**](/docs/ARCHITECTURE.md): Data flow diagrams, state management, and code conventions.
-   [🗄️ **Database Schema**](/docs/DB_SCHEMA.md): Table definitions, JSONB snapshots, and RLS security policies.
-   [📘 **Playbooks**](/docs/): Specific execution guides for each engineering phase.

---

## 5. Tech Stack

* **Next.js 16** (App Router + Server Actions)
* **TypeScript 5.9**
* **Supabase** (Postgres + Auth)
* **Zustand** (State management)
* **SCSS Modules** (Design system tokens & components)

````

---

