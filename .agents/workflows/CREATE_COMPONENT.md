---
description: Create a fully scaffolded, canonical Next.js App Router React Component suite, encompassing styling, testing, and strict architectural standards.
---

# `CREATE_COMPONENT` Workflow

## Trigger

Use this workflow whenever requested to "create a component," "generate a new widget/element," or any similar directive.

## Inputs

- Component name and purpose
- Target directory/domain
- Expected interactions and accessibility constraints

## Execution Steps

1. **Analyze Request Scope:**
   - Determine the exact name (`ComponentName`) and purpose of the component.
   - Identify the most appropriate directory (e.g., `components/Calculator/`, `components/shared/`).

2. **Create Canonical Directory:**
   - Create a new folder: `components/.../ComponentName/`.

3. **Generate the Component (`ComponentName.tsx`):**
   - Create a strongly-typed functional component.
   - Define a strict `Props` interface (no `any`).
   - **Crucial:** Ensure it's a Server Component by default unless interactivity dictates `'use client'`.
   - Import only necessary SCSS modules.

4. **Generate Styling (`ComponentName.module.scss`):**
   - Create a co-located SCSS module file.
   - Use established variables, mixins, or design tokens instead of hardcoded values.
   - Prefix primary classes logically (e.g., `.wrapper`, `.container`, `.header`).

5. **Generate the Test Suite (`ComponentName.test.tsx`):**
   - Create a robust Vitest + Testing Library suite.
   - Include a render test and, at minimum, one test verifying a critical behavior, accessibility invariant, or state interaction.

6. **Export the Component (`index.ts`):**
   - Create the public API for the component: `export { default } from './ComponentName';`.

7. **Final Verification:**
   - Confirm all files exist in the same directory.
   - Verify the component is imported cleanly wherever intended.

## Success Criteria

- Canonical file set exists and is colocated.
- Component is typed, style-isolated, and test-covered for core behavior.
- No architectural violations are introduced (unnecessary `'use client'`, inline styles, or ad-hoc patterns).

## Failure Handling

- If required inputs are missing, propose the smallest default and continue.
- If existing architecture conflicts with scaffold placement, document conflict and use closest canonical location.
