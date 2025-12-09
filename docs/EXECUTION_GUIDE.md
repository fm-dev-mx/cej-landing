# Execution Guide: CEJ Platform

**Status:** Living Document
**Version:** 3.0 (SaaS Portal Active)

## 1. Vision & Core Philosophy

We prioritize the user's ability to complete a quote and contact sales above all else. This means implementing "Fail-Open" mechanisms where a database outage or API failure never blocks the user from seeing a "Success" message, even if we have to degrade gracefully to email backups.

## 2. Tech Stack Constraints

- **Framework:** Next.js 16 (App Router).
- **Language:** TypeScript 5.9 (Strict Mode). No `any`.
- **Styling:** **SCSS Modules** only.
  - **Constraint:** **No Tailwind CSS**. Adhere to `_tokens.scss` and `_mixins.scss`.
- **State:** Zustand v5 (with Persistence Middleware).
- **Validation:** Zod (Runtime schema validation for ALL inputs).

## 3. Architecture Overview

Please refer to `docs/ARCHITECTURE.md` for the full data flow diagrams.

- **Tracking:** See `docs/TRACKING_GUIDE.md` for CAPI, Pixel, and SEO details.
- **Pricing:** See `docs/PRICING_MODEL.md` for math logic and business rules.

## 4. Execution Roadmap

We follow a strict, serialized playbook approach.
Do not proceed to the next phase until the Exit Criteria of the current phase are met.

| **Phase** | **Playbook/Ref** | **Goal** | **Status** |
| :--- | :--- | :--- | :--- |
| **0. Hardening** | `archive/PLAYBOOK_00...` | Math accuracy & A11y. | ✅ Completed |
| **1. Data Core** | `archive/PLAYBOOK_01...` | DB Persistence & Fail-Open. | ✅ Completed |
| **2. Engine** | `archive/PLAYBOOK_02...` | Expert features (Additives). | ✅ Completed |
| **3. Marketing** | `docs/TRACKING_GUIDE.md` | Server-side Tracking (CAPI). | 🏃 **Active** |
| **4. SaaS** | `docs/PLAYBOOK_04_SAAS_PORTAL.md` | User Auth & History. | Planned |

## 5. Development Protocol

1. **Check the Guide:** Verify your PR against the active Playbook requirements.
2. **Type-First:** Define Zod schemas before writing logic.
3. **Strict Logs:** Use structured logging for server actions.
    - *Format:* `[MODULE:ACTION] <Status> | Payload: {...}`
4. **Sync Rules:**
    - If you modify `lib/pricing.ts`, update `lib/pricing.test.ts`.
    - If you change the DB Schema, update `docs/DB_SCHEMA.md`.
    - If you modify `lib/tracking/*` or `lib/seo.ts`, update `docs/TRACKING_GUIDE.md`.
5. **Quality Gate:**
    - **Critical Path Validation:** Automated tests (Unit & Integration) covering math logic and checkout flows must pass 100% before any merge to main.
    No Phase exit criteria is met without passing regression tests.
