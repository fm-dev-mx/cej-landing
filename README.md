# 🏗️ CEJ Platform (Landing + SaaS)

**A hybrid Next.js platform combining a high-performance landing page with a scalable SaaS OS for concrete order management.**

![Status](https://img.shields.io/badge/Status-Phase_2_Complete-green)
![Version](https://img.shields.io/badge/Version-0.2.0-blue)
[![Changelog](https://img.shields.io/badge/Keep_a-Changelog-orange)](./CHANGELOG.md)
![Coverage](https://img.shields.io/badge/Tests-Vitest-yellow)

---

## 1. Project Vision

**Concreto y Equipos de Juárez (CEJ)** is evolving from manual sales processes to a digital-first platform solving two critical problems:

1.  **Lead Generation (Public):** A friction-free calculator to capture anonymous traffic, providing precise volume estimation and immediate lead conversion via WhatsApp.
2.  **Order Management (Private SaaS):** A "CEJ Pro" portal for recurring contractors to manage order history, fiscal data, and repeat purchases.

---

## 2. Current Status (Phase 3: Marketing Ops)

The project has successfully deployed the **Expert Engine** (v0.2.0) and is now focusing on Marketing Technology integrations.

### ✅ Operational Modules

-   **Expert Pricing Engine:** A dynamic, dependency-injected calculation core capable of handling complex pricing rules, additives (fiber, accelerants), and service fees.
-   **Fail-Open 2.0:** The application operates with a robust fallback configuration (`DEFAULT_PRICING_RULES`), ensuring zero downtime even if the database connection fails.
-   **Lead Database:** Anonymous lead ingestion into Supabase (`public.leads`) using Server Actions.
-   **State Management:** Advanced Zustand store with versioning and auto-migration to handle state schema evolution without breaking user sessions.

### 🚀 Active Development (Phase 3)

-   **Meta CAPI:** Implementing server-side tracking to bypass iOS privacy restrictions.
-   **Semantic SEO:** Structuring `OfferCatalog` data for rich search results.

---

## 3. Quick Start

### Prerequisites

-   Node.js 20+
-   pnpm (`npm install -g pnpm`)
-   A Supabase Project (See `/docs/DB_SCHEMA.md` for setup).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repo-url>
    cd cej-landing
    pnpm install
    ```

2.  **Environment Configuration:**
    Duplicate `.env.example` to `.env.local`.

    ```bash
    # Supabase (Required for Persistence, Optional for Dev)
    NEXT_PUBLIC_SUPABASE_URL=[https://your-project.supabase.co](https://your-project.supabase.co)
    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

    # Monitoring (Optional)
    MONITORING_WEBHOOK_URL=[https://hooks.slack.com/](https://hooks.slack.com/)...
    ```

3.  **Run Development Server:**
    ```bash
    pnpm dev
    ```

4.  **Run Tests:**
    Ensure business logic integrity before pushing.
    ```bash
    pnpm test        # Run Unit Tests
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

| Category | Technology | Justification |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16** | App Router for layouts, Server Components, and Server Actions. |
| **Language** | **TypeScript** | Strict typing is mandatory for financial/pricing logic. |
| **Backend** | **Supabase** | Managed PostgreSQL, Auth (Magic Link), and Real-time capabilities. |
| **State** | **Zustand** | Lightweight state management with built-in `localStorage` persistence. |
| **Styling** | **Sass (Modules)** | Modular, scoped styling with a centralized Design System. |
| **Validation** | **Zod** | Runtime schema validation for forms, API inputs, and configuration objects. |
| **Testing** | **Vitest** | High-performance unit testing for the pricing engine. |

---

*Documentation maintained by the FM Creativo Engineering Team.*
