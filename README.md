# 🏗️ CEJ Platform (Landing + SaaS)

**A hybrid Next.js platform combining a high-conversion landing page with a progressive web application (PWA) for construction order management.**

![Status](https://img.shields.io/badge/Status-Active_Development-green)
![Stack](https://img.shields.io/badge/Stack-Next.js_15_|_Supabase_|_Zustand-blue)

---

## 1. Project Overview

### Product Description
This platform serves as the digital storefront and operational operating system for **Concreto y Equipos de Juárez**. It solves the friction between capturing anonymous traffic and retaining professional customers through a dual-context architecture:

1.  **Public Context (Conversion Engine):** A friction-free landing page allowing users to calculate volumes, estimate costs, and generate leads via WhatsApp without forced registration.
2.  **Private Context (Productivity SaaS):** A restricted dashboard for recurring customers (Contractors/Architects) to manage project history, generate formal PDF quotes, and clone previous orders.

### Current Scope (MVP)
* **Calculators:** Real-time volume estimation for slabs, footings, and walls.
* **Session Cart:** Local persistence of multiple quote items.
* **Lead Gen:** WhatsApp integration with formatted order summaries.
* **Out of Scope:** Payment gateway (Stripe/MercadoPago), real-time GPS truck tracking.

---

## 2. Architecture & Structure

The project uses **Next.js App Router** with a modular architecture that strictly separates marketing concerns from application logic.

### Directory Structure
```bash
├── app/
│   ├── (marketing)/      # Public routes (Landing, Services, Contact) - Optimized for SEO/LCP
│   ├── (app)/            # Authenticated routes (/cotizador, /admin) - Protected by Middleware
│   ├── actions/          # Server Actions (Data mutations, Lead submission)
│   ├── api/              # Route Handlers (Webhooks)
│   └── layout.tsx        # Root layout (Fonts, Providers)
├── components/
│   ├── Calculator/       # Complex business logic components (Forms, Summary)
│   ├── ui/               # Reusable UI primitives (Buttons, Inputs, Modals)
│   └── layouts/          # Structural components (Header, Footer, Shells)
├── config/               # Static configuration (Business constants, Nav links)
├── hooks/                # Custom React Hooks (Logic separation)
├── lib/                  # Utilities, Domain Logic, Pricing Engine, Schemas
├── store/                # Zustand Stores (Client-side state & Local Persistence)
└── styles/               # Global SCSS, Mixins, Design Tokens
````

-----

## 3\. Tech Stack

| Category | Technology | Justification |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15+** | App Router for layouts, Server Components, and Server Actions. |
| **Language** | **TypeScript** | Strict typing is mandatory for financial/pricing logic. |
| **Backend** | **Supabase** | Managed PostgreSQL, Auth (Magic Link), and Real-time capabilities. |
| **State** | **Zustand** | Lightweight state management with built-in `localStorage` persistence. |
| **Styling** | **Sass (Modules)** | Modular, scoped styling with a centralized Design System (`_tokens.scss`). |
| **Validation** | **Zod** | Runtime schema validation for forms and API inputs to ensure data integrity. |
| **Testing** | **Vitest** | High-performance unit testing for the pricing engine. |

-----

## 4\. Database & Data Model

We utilize **PostgreSQL** via Supabase. The schema is designed to support the transition from anonymous leads to registered orders.

### Core Entities

  * **`profiles`**: Extends `auth.users` with commercial data (RFC, Billing Address).
  * **`orders`**: The header of a quote/order.
      * `status`: State machine (`draft`, `submitted`, `approved`, `paid`, `delivered`, `cancelled`).
      * `total_amount_snapshot`: The final price at the time of creation (prevents historical price drift).
  * **`order_items`**: Line items (Concrete type, pump service, etc.).
      * `quote_data`: **JSONB** column. Stores the *exact* inputs used for calculation (dimensions, specific formulas) to allow auditing without complex schema migrations.
  * **`price_config`**: Global configuration table for base prices per m³ and service fees.

### Security

  * **RLS (Row Level Security):** Strictly enforced.
      * Users can only `SELECT/UPDATE` their own orders.
      * `service_role` (Admin) has full access to all records.

-----

## 5\. User Roles & Permissions

| Feature | Visitor (Public) | Registered (Contractor) | Internal (Admin) |
| :--- | :---: | :---: | :---: |
| **Quote Calculator** | ✅ | ✅ | ✅ |
| **View Estimates** | ✅ | ✅ | ✅ |
| **Cart Persistence** | Local (Session) | Cloud (Synced) | Cloud |
| **Submit Order** | WhatsApp | WhatsApp / System | - |
| **History** | ❌ | ✅ (Saved in DB) | ✅ (View All) |
| **PDF Generation** | Simple Ticket | Branded PDF | Official PDF |
| **Price Override** | ❌ | ❌ | ✅ (Manual Adjustment) |
| **Status Management** | ❌ | ❌ (Cancel only) | ✅ (Full Workflow) |

-----

## 6\. Current Implementation Status

### ✅ Implemented Modules

1.  **Landing Page (`/`)**: Fully responsive, SEO-optimized marketing page.
2.  **Calculator Core**: `useQuoteCalculator` hook handling volume logic for Slabs, Footings, and Walls.
3.  **Cart System**: `useCejStore` implementing persistent local storage for multiple items.
4.  **Lead Capture**: `LeadFormModal` requesting minimum viable data (Name/Phone) at the end of the funnel.
5.  **WhatsApp Integration**: Generates pre-formatted text messages for immediate ordering.

-----

## 7\. Pending Features & Roadmap

This roadmap is designed to pay down technical debt first, then scale into a SaaS product.

### PHASE 1: Core Refactor & Domain Hardening

*Goal: Decouple business logic from UI and establish a "Single Source of Truth" for types.*

  * [ ] **Type Unification**: Merge `types/order.ts` and `components/Calculator/types.ts` into a central Domain definition.
  * [ ] **Logic Decoupling**: Refactor `useQuoteCalculator` to be a pure function, testable without React context.
  * [ ] **Validation Hardening**: Implement strict Zod schemas for all calculator inputs (dimensions, strength, type).
  * [ ] **Store Optimization**: Refactor `useCejStore` into granular slices to prevent unnecessary re-renders.
  * [ ] **Testing**: Increase coverage for `lib/pricing.ts` and the new pure calculator logic.

### PHASE 2: Backend Foundation & Data Modeling

*Goal: Establish the database infrastructure and security policies.*

  * [ ] **Schema Design V1**: Implement `profiles`, `orders`, `order_items` tables in Supabase.
  * [ ] **RLS Policies**: Configure Row Level Security (e.g., "Users can only see their own orders").
  * [ ] **Audit Trail**: Configure JSONB snapshots for quote parameters.
  * [ ] **Server Action Audit**: Security review of `submitLead` and connection to the new schema.

### PHASE 3: Authentication & The "Bridge"

*Goal: Convert anonymous traffic into registered users without data loss.*

  * [ ] **Supabase Auth**: Implement Magic Link and Google Login.
  * [ ] **Protected Routes**: Create HOC/Middleware for `/cotizador/*`.
  * [ ] **The Sync Engine**: Create `useSyncCart` hook. On login, it detects local items, pushes them to Supabase `orders`, and clears localStorage.
  * [ ] **User Profile**: Form to collect billing/fiscal data.

### PHASE 4: Private SaaS Dashboard

*Goal: Provide value to the recurring customer.*

  * [ ] **Dashboard UI**: Data table with filters (Date, Status, Project Name).
  * [ ] **Detail View**: Dynamic `/cotizador/[id]` page to view historical order details.
  * [ ] **Actions**: Implement "Clone Order" and "Download Simple PDF".
  * [ ] **PDF Engine**: Integrate `@react-pdf/renderer` for server-side generation of branded quotes.

### PHASE 5: Internal Admin & Advanced Logic

*Goal: Empower the sales team.*

  * [ ] **Admin Dashboard**: Kanban/Pipeline view of all global leads at `/admin`.
  * [ ] **Price Override Engine**: UI for Admins to manually adjust line-item prices in specific orders.
  * [ ] **Global Config UI**: Interface to update base prices (`price_config`) without code deployments.
  * [ ] **Metrics**: Basic KPIs (Total quoted volume, Conversion rate).

-----

## 8\. Installation & Setup

### Prerequisites

  * Node.js 20+
  * pnpm (`npm install -g pnpm`)

### Quick Start

1.  **Clone the repository:**

    ```bash
    git clone <repo-url>
    cd cej-landing
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Environment Setup:**
    Duplicate `.env.example` to `.env.local` and configure:

    ```bash
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    NEXT_PUBLIC_SITE_URL=http://localhost:3000
    ```

4.  **Run Development Server:**

    ```bash
    pnpm dev
    ```

-----

## 9\. Testing & Quality

We prioritize testing **business logic** (money/volume) over UI snapshots.

  * **Unit Tests (`*.test.ts`)**: Mandatory for `lib/pricing.ts` and `hooks/useQuoteCalculator`.
  * **Component Tests (`*.test.tsx`)**: Use React Testing Library for critical forms.

**Commands:**

```bash
pnpm test        # Run tests in watch mode
pnpm test:ui     # Open Vitest UI
pnpm lint        # Run ESLint check
```

-----

## 10\. Conventions & Best Practices

  * **Strict Typing**: Do not use `any`. Define interfaces in `types/domain.ts` or co-locate if component-specific.
  * **Mobile First**: All styles must be written for mobile first, using mixins for larger breakpoints (`@include respond-to('md')`).
  * **Clean Code**:
      * Extract complex logic to custom hooks (`hooks/`).
      * Use Zod for *all* user input validation.
      * Avoid magic numbers; use constants from `config/business.ts`.
  * **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat: add auth`, `fix: pricing rounding`).

-----

*Documentation maintained by the Engineering Team.*
