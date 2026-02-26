# Contributing to CEJ Landing

First off, thanks for taking the time to contribute! 🎉

This document describes the standards, workflows, and guidelines for developing on the CEJ Landing platform.
Please review it carefully to maintain consistency across the codebase.

## 🛠 Tech Stack

We use a modern, strict-typed stack:

- **Framework:** Next.js 16 (App Router + Server Actions)
- **Language:** TypeScript 5.9
- **Styling:** SCSS Modules + CSS Variables (Tokens)
- **State Management:** Zustand 5.x
- **Validation:** Zod 3.x
- **Database/Auth:** Supabase
- **Testing:** Playwright (E2E) & Vitest (Unit)

## 📂 Project Structure

We follow a **Feature-First** and **Component-Folder** architecture.

```text
src/
├── app/                 # Next.js App Router (Route Groups)
├── components/
│   ├── ui/              # Atomic Design Components (Button, Input)
│   ├── layouts/         # Global Layouts (Header, Footer)
│   └── Calculator/      # Domain-specific Feature Module
├── lib/
│   ├── schemas/         # Shared Zod Schemas
│   └── tracking/        # Analytics & Pixel logic
└── styles/              # Global SCSS tokens and mixins
```

## 🎨 Design System & UI

Before creating new styles or components, you **MUST** consult the design documentation.
We avoid hardcoded values in favor of semantic tokens.

- **Design Tokens:** See [`docs/DESIGN_SYSTEM.md`](/docs/DESIGN_SYSTEM.md) for color palettes (`-c-primary`), spacing (`-sp-4`), and typography.
- **Component Library:** Check [`docs/COMPONENT_LIBRARY.md`](/docs/COMPONENT_LIBRARY.md) for existing atoms and their props.
- **Icons:** Follow the guidelines in [`docs/ICONOGRAPHY.md`](/docs/ICONOGRAPHY.md).
- **UI States:** Handle empty, loading, and error states as defined in [`docs/UI_STATES.md`](/docs/UI_STATES.md).

> Rule: Do not use Tailwind utility classes. Use SCSS Modules with our global tokens.

## ♿ Accessibility (A11y)

We are committed to **WCAG 2.1 Level AA** compliance.

- Review [`docs/ACCESSIBILITY.md`](/docs/ACCESSIBILITY.md) before submitting PRs.
- Ensure all interactive elements have keyboard support (`Tab`, `Enter`, `Space`).
- Use semantic HTML (`<button>`, not `<div onClick>`).
- Verify adequate color contrast and ARIA labels.

## 🧪 Testing Strategy

We treat testing as a requirement, not an afterthought.

### 1. End-to-End (E2E) - Playwright

Used for critical user flows (Calculator, Checkout, Auth) and Accessibility checks.

- **Run:** `pnpm test:e2e`
- **Locators:** Prefer `getByRole`, `getByLabel`, or `getByTestId` over CSS selectors.

### 2. Unit Testing - Vitest

Used for pure logic (Pricing engine, Helpers, Zod schemas).

- **Run:** `pnpm test`

## 🚀 Development Workflow

1. **Clone & Install:**

    ```bash
    git clone [repo-url]
    pnpm install
    ```

2. Environment:

    Copy .env.example to .env and populate Supabase keys.

3. Branching:

    Use conventional prefixes: feature/, fix/, docs/, refactor/.

4. Commit Messages:

    We follow strict Conventional Commits.

    - `feat: add re-ordering capability`
    - `fix: resolve calculator rounding error`
    - `docs: update playbook 04`

## 📝 Documentation

Documentation is code.
If you change business logic, you must update the corresponding files in `/docs`:

- **Business Rules:** [`docs/PRICING_MODEL.md`](/docs/PRICING_MODEL.md)
- **Data Structure:** [`docs/DB_SCHEMA.md`](/docs/DB_SCHEMA.md)
- **User Flows:** [`docs/UX_FLOWS.md`](/docs/UX_FLOWS.md)

---

*Happy Coding!*
