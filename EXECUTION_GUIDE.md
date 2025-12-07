# EXECUTION_GUIDE.md

## 1. Project Vision

Product: High-performance Lead Generation Landing Page & Calculator for "Concreto y Equipos de Juárez" (CEJ).

Core Problem: Contractors struggle with concrete volume estimation and require immediate, friction-less ordering via WhatsApp.

Technical Goal: Create a robust, "offline-first" feeling web app that captures leads reliably, calculates prices with high precision, and integrates seamlessly with Meta's marketing ecosystem (Pixel + CAPI).

## 2. Architectural Audit & Stack

Based on the code analysis, the project utilizes a modern, type-safe stack optimized for Vercel deployment:

- **Framework:** **Next.js 16.0.7** (App Router).
- **Language:** TypeScript 5.9 (Strict Mode).
- **Styling:** **SCSS Modules** (`.module.scss`) with a custom Token System (`_tokens.scss`) & Mixins. *Note: No Tailwind detected.*
- **State Management:** **Zustand** v5 (with `persist` middleware for LocalStorage hydration).
- **Validation:** **Zod** for schema validation (forms & env vars).
- **Testing:** **Vitest** + React Testing Library.
- **Backend:** **Supabase** (PostgreSQL) integrated via Next.js Server Actions.
- **Analytics:** Meta Pixel (Client) + Vercel Analytics/Speed Insights.

## 3. Phase Map

The Execution Plan is divided into 4 strategic phases to align with the roadmap while ensuring stability:

1. **PHASE 1: QA & INFRASTRUCTURE HARDENING.**
    - *Goal:* Solidify the calculator core (`lib/pricing.ts`) and ensure type safety before adding database logic.
    - *Gap Addressed:* The current calculator works but lacks edge-case testing for "Minimum Order" rules impacting the cart.
2. **PHASE 2: DATA PERSISTENCE & INTEGRATION.**
    - *Goal:* Implement the Supabase connection for `leads`.
    - *Strategy:* Use **Server Actions** instead of API Routes (modern approach) while maintaining the "Fail-open" logic (redirect to WhatsApp even if DB fails).
3. **PHASE 3: CALCULATOR EVOLUTION (Expert Mode).**
    - *Goal:* Activate the `ExpertToggle` functionality hinted in the code but not fully implemented.
    - *Gap Addressed:* The store has `viewMode`, but the UI doesn't fully support granular inputs (Slump, Additives) yet.
4. **PHASE 4: MARKETING OPS & SEO (CAPI).**
    - *Goal:* Implement Server-Side Event tracking to match the client-side Pixel.
    - *Alignment:* Integration with Facebook Conversions API (CAPI).

## 4. Golden Rules

1. **SCSS Modules Only:** Do not introduce Tailwind. Adhere to `styles/_mixins.scss` for responsiveness and `_tokens.scss` for variables.
2. **Server Actions First:** Mutations must use `use server` actions in `app/actions/`. Do not create `pages/api` routes.
3. **Fail-Open UX:** Critical paths (Calculator -> WhatsApp) must work even if the database is down.
4. **Zod Validation:** All inputs entering the system (Client or Server) must be validated against `lib/schemas.ts`.
5. **Strict Types:** No `any`. Use the types defined in `types/order.ts` and `components/Calculator/types.ts`.

## 5. Prompt Engineering Guide

To execute these phases via AI, copy the content of the specific `EXECUTION_PHASE_X` file.

- **Context:** "You are a Senior React Developer working on the CEJ Landing project (Next.js 16 + SCSS Modules)."
- **Constraint:** "Respect the existing BEM naming convention in SCSS and the Zustand store structure."
