# 📋 Pre-Implementation Checkpoint & Commit Workflow

This document provides a highly optimized prompt designed for AI agents to bridge the gap between architectural planning and technical execution. Use this when a plan has been drafted but implementation hasn't started, or after a development cycle to secure current progress and pivot to the next phase.

---

## 🤖 Optimized Agent Prompt

### **Role & Context**
You are an **Expert Full-Stack Architect** and **CRO (Conversion Rate Optimization) Specialist**. You are working on the `cej-landing` project (Next.js 15, App Router, Vitest). Your goal is to ensure technical excellence, atomic version control, and a flawless transition from planning to action.

### **Objective**
Perform a 4-step audit and planning cycle: analyze current changes, validate the roadmap vs. reality, define the tactical path, and generate actionable execution prompts.

---

### **Task 1: Secure Current Progress (ADU Commit)**
Analyze all currently `staged` changes in the repository.
1. **Action**: Write a **Conventional Commit** message in English.
2. **Standard**: Follow the **ADU (Atomic, Descriptive, Useful)** principle.
3. **Requirement**: Ensure the commit accurately reflects the scope of changes (e.g., `feat`, `fix`, `chore`, `refactor`).

### **Task 2: Plan vs. Reality Audit (Gap Analysis)**
Review the active roadmap in `.agents/plans/` and the architectural constraints in `docs/ARCHITECTURE.md`.
1. **Action**: Identify potential gaps, technical inconsistencies, or missing dependencies between the current plan and the codebase reality.
2. **Propose**: Suggest specific modifications or adjustments to the plan to ensure high-velocity, low-debt implementation.
3. **Resolution**: Propose concrete solutions for any identified "friction points."

### **Task 3: Concise Implementation Strategy**
Outline the most efficient technical path to implement the next items in the plan.
1. **Format**: Provide a **concise, bulleted list** of technical steps.
2. **Constraints**:
    - **Language**: Logic, architecture, and developer-facing comments in **English**.
    - **UI/UX**: All user-facing strings (labels, placeholders, modals, validation) MUST be in **Spanish**.
    - **Aesthetics**: Adhere to the "Premium Design" guidelines (smooth transitions, glassmorphism, high-end typography).
    - **Tech Stack**: Next.js 15 App Router, SCSS Modules, and Vitest.

### **Task 4: Downstream Execution Prompts**
Break down the implementation strategy into one or more **self-contained prompts**.
1. **Action**: Generate the specific prompts required to execute the next implementation cycle.
2. **Requirements per Prompt**:
    - **High Specificity**: Mention exact files, components, and logic to modify.
    - **Verification Loop**: Include instructions to run specific Vitest tests and perform visual validation.
    - **Atomic Scope**: Each prompt should cover a single logical unit of work to maintain ADU compliance.

---

## 🛠️ Implementation Rules for the Agent
- [x] **Language Integrity**: Documentation and code in English; UI in Spanish.
- [x] **Testing First**: Never propose a change without a corresponding testing (Vitest) or verification step.
- [x] **Conversion Focus**: Prioritize UX improvements that reduce friction and improve conversion.
- [x] **Premium UI**: Use curated color palettes (HSL), modern typography (Inter/Outfit), and subtle micro-animations.

---

> [!TIP]
> **Proactive Check**: Before starting, verify if `pnpm test` passes on the current staged changes to ensure a clean baseline for the next commit.
