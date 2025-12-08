# 🏗️ CEJ Platform (Landing + SaaS)

**A hybrid Next.js platform combining a high-performance landing page with a scalable SaaS OS for concrete order management.**

[Status](https://img.shields.io/badge/Status-Phase_2_Expert_Engine-blue)

[Stack](https://img.shields.io/badge/Stack-Next.js_16_%7C_Supabase_%7C_Zustand-blue)

[Coverage](https://img.shields.io/badge/Tests-Vitest-yellow)

---

## 1. Project Vision

**Concreto y Equipos de Juárez (CEJ)** is evolving from manual sales processes to a digital-first platform solving two critical problems:

1. **Lead Generation (Public):** A friction-free calculator to capture anonymous traffic, precise volume estimation (Slabs/Footings), and immediate lead conversion via WhatsApp.
2. **Order Management (Private SaaS):** A "CEJ Pro" portal for recurring contractors to manage order history, fiscal data, and repeat purchases.

---

## 2. Current Status (Phase 2: Expert Engine)

The project currently operates as a robust marketing site with local persistence and a database-backed lead capture system.

### ✅ Operational Modules

- **Landing Page (`app/(marketing)`):** Fully responsive, SEO-optimized, and instrumented with Meta Pixel & Vercel Analytics.
- **Calculation Engine (`useQuoteCalculator`):** Business logic validated for Slabs (Solid/Coffered), Footings, and Walls. Unit tested via Vitest.
- **Lead Database:** Anonymous lead ingestion into Supabase (`public.leads`) using Server Actions with a strict **"Fail-Open" strategy** (system works even if DB is down).
- **Local Persistence:** Guest cart state persists across reloads using `localStorage` + Zustand.

### ⚠️ Critical Known Issues (WIP)

- **Static Pricing:** Prices are currently hardcoded in `config/business.ts`. The migration to the dynamic `price_config` database table is the next priority.
- **Hidden Expert Mode:** Logic for additives (accelerants, fiber) exists in the store but is hidden in the UI.

---

## 3. Quick Start

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- A Supabase Project (See `/docs/DB_SCHEMA.md` for setup).

### Installation

1. **Clone the repository:**

    ```bash
    git clone <repo-url>
    cd cej-landing
    pnpm install
    ```

2. Environment Configuration:Bash

    Duplicate .env.example to .env.local. Note that NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are optional for development; the app will run in "Fail-Open" mode without them.

    ```tsx
    # Supabase (Optional for Dev, Required for Prod)
    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # SERVER-SIDE ONLY

    # Monitoring (Optional)
    MONITORING_WEBHOOK_URL=https://hooks.slack.com/...`
    ```

3. **Run Development Server:**Bash

    ```tsx
    pnpm dev
    ```

4. Run Tests:Bash

    Ensure business logic integrity before pushing.

    ```tsx
    pnpm test        # Run Unit Tests (Single Pass)
    pnpm test:watch  # Run Unit Tests (Watch Mode)`
    ```


---

## 4. Documentation

For detailed architecture, database schemas, and the development roadmap, please refer to the `/docs` directory:

- [🗺️ **Roadmap & Sprints**](/docs/ROADMAP.md): Project phases, user roles, and execution plan.
- [🏗️ **Architecture**](/docs/ARCHITECTURE.md): Data flow diagrams, state management, and code conventions.
- [🗄️ **Database Schema**](/docs/DB_SCHEMA.md): Table definitions, JSONB snapshots, and RLS security policies.

---

## 5. Tech Stack

| **Category** | **Technology** | **Justification** |
| --- | --- | --- |
| **Framework** | **Next.js 16** | App Router for layouts, Server Components, and Server Actions. |
| **Language** | **TypeScript** | Strict typing is mandatory for financial/pricing logic. |
| **Backend** | **Supabase** | Managed PostgreSQL, Auth (Magic Link), and Real-time capabilities. |
| **State** | **Zustand** | Lightweight state management with built-in `localStorage` persistence. |
| **Styling** | **Sass (Modules)** | Modular, scoped styling with a centralized Design System (`_tokens.scss`). |
| **Validation** | **Zod** | Runtime schema validation for forms and API inputs to ensure data integrity. |
| **Testing** | **Vitest** | High-performance unit testing for the pricing engine. |

---

*Documentation maintained by the FM Creativo Engineering Team.*
