# Execution Guide: CEJ Platform

**Status:** Living Document
**Version:** 3.1 (Updated for Phase 4 Prep)

## 1. Vision & Core Philosophy

We prioritize the user's ability to complete a quote and contact sales above all else. This means implementing "Fail-Open" mechanisms where a database outage or API failure never blocks the user from seeing a "Success" message.

## 2. Tech Stack Constraints

- **Framework:** Next.js 16 (App Router).
- **Language:** TypeScript 5.9 (Strict Mode). No `any`.
- **Styling:** **SCSS Modules** only. No Tailwind.
- **State:** Zustand v5 (with Persistence).
- **Validation:** Zod (Runtime schema validation).

## 3. Architecture Overview

See `docs/ARCHITECTURE.md` for diagrams and data flow.
See `docs/DESIGN_SYSTEM.md` for styling rules and tokens.

## 4. Execution Roadmap

| **Phase** | **Playbook/Ref** | **Goal** | **Status** |
| :--- | :--- | :--- | :--- |
| **0. Hardening** | `archive/PLAYBOOK_00...` | Math accuracy & A11y. | ✅ Completed |
| **1. Data Core** | `archive/PLAYBOOK_01...` | DB Persistence & Fail-Open. | ✅ Completed |
| **2. Engine** | `archive/PLAYBOOK_02...` | Expert features (Additives). | ✅ Completed |
| **3. Marketing** | `docs/TRACKING_GUIDE.md` | Server-side Tracking (CAPI). | ✅ Completed |
| **4. SaaS** | `docs/PLAYBOOK_04_SAAS_PORTAL.md` | User Auth & History. | 🏃 **Active** |

## 5. Development Protocol

1. **Type-First:** Define Zod schemas before writing logic.
2. **Strict Logs:** Use structured logging: `[MODULE:ACTION] <Status> | Payload: {...}`
3. **Sync Rules:**
    - If you modify `lib/pricing.ts`, update `lib/pricing.test.ts`.
    - If you change DB Schema, update `docs/DB_SCHEMA.md`.

## 6. Testing Protocols

We enforce a **100% Pass Rate** policy for the critical path (Pricing & Checkout).

### 6.1 Unit Tests (Vitest)

Validates pure logic (Math, Pricing Rules, Utils).

- **Command:** `pnpm test`
- **Watch Mode:** `pnpm test:watch`
- **Location:** co-located with components.

### 6.2 E2E Tests (Playwright)

Validates the full user journey (Calculator -> Form -> Submit).

- **Command:** `pnpm test:e2e`
- **UI Mode:** `pnpm test:e2e:ui` (Recommended for debugging)
- **Scope:** Smoke tests for Marketing pages and Critical Flows for the Calculator.

## 7. CI/CD Pipelines

Automated checks run on every Push and Pull Request via GitHub Actions.

1. **CI Workflow (`.github/workflows/ci.yml`):**
   - **Lint:** Checks ESLint rules and TypeScript types.
   - **Unit:** Runs Vitest.
   - **Build:** Verifies `next build` passes.
2. **Playwright Workflow (`.github/workflows/playwright.yml`):**
   - Runs E2E tests on a headless browser to ensure no regression in critical flows.

## 8. Contribution Standards

### 8.1 Commit Convention

We follow **Conventional Commits** to automate changelogs and versioning.

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Formatting (missing semi colons, etc)
- `refactor:` Code change that neither fixes a bug nor adds a feature
- `test:` Adding missing tests
- `chore:` Build process or aux tool changes

*Example:* `feat(pricing): add support for fiber additive`
