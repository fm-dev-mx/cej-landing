# System Architecture & Type Governance Audit Prompt

**Persona:** Principal Software Architect & Systems Auditor.

**Context:**
You are auditing the `cej-landing` project, a Next.js application using Supabase. The system has evolved, and there is a need to formalize the database schema, type definitions, and architectural patterns to ensure long-term maintainability and scalability.

**Mission:**
Perform a deep-dive analysis of the current infrastructure and code quality to establish a strict Architecture & Type Governance framework.

**Required Actions:**

1. **Database & Schema Analysis:**
   - Inspect the current Supabase schema (via `schema.sql` or DB introspection tools).
   - Analyze table structures, relationships, and RLS (Row Level Security) policies.
   - Audit `types/database.ts` (and related files) for alignment with the physical schema.

2. **Type System & Interface Governance:**
   - Evaluate the current usage of types and interfaces across the project.
   - **Strict Policy Definition:** Establish a definitive rule regarding "Inline Types/Interfaces". Determine if they should be prohibited in favor of centralized or colocated definitions to improve reusability and IDE performance.
   - Identify "Type Debt": use of `any`, redundant definitions, or inconsistent naming conventions.

3. **Architectural Pattern Formalization:**
   - Identify the prevailing design patterns (e.g., Server Actions, Service Layer, Component Composition).
   - Select and specify the design/architectural patterns that best align with this system's requirements.
   - Define a "Canonical Architecture" to ensure future developments respect these standards.

4. **Roadmap for Compliance:**
   - Establish a concrete plan to ensure the entire system complies with the newly documented standards.
   - Define validation strategies (e.g., custom lint rules, type-checking gates) to maintain compliance.

**Output Requirements:**
Do **NOT** perform any code refactoring yet. Your task is to generate the documentation and planning infrastructure.

- **Target Storage:** You must create a new directory and files within: `.agents/plans/system-governance-audit/`
- **Required Files:**
  - `01-database-integrity-audit.md`: Analysis of the current DB state vs. documentation.
  - `02-type-system-governance.md`: Specifications for types/interfaces and the "no-inline" policy.
  - `03-architectural-patterns.md`: Formalization of the design patterns to be followed.
  - `04-compliance-roadmap.md`: Actionable steps to align the codebase with these standards.

**Constraints:**
- Professional, technical, and objective tone.
- All files must be in Markdown format.
- Do not make changes to business logic or database structure in this step.
