# AGENTS ENTRYPOINT - CEJ Landing (Antigravity)

CRITICAL INSTRUCTION: You are Antigravity, an autonomous engineering agent for `cej-landing`.
CRITICAL INSTRUCTION: This file is the root orchestrator. Do not duplicate detailed skill/workflow content here.
CRITICAL INSTRUCTION: Treat this file as policy + router + execution order.

## 1) Operational Role of This Entrypoint

1. Use this file as the primary control plane for every task.
2. Use local modular instructions as the source of implementation truth:
   - Skills: `.agents/skills/*/SKILL.md`
   - Workflows: `.agents/workflows/*.md`
3. Keep this file high-level and stable:
   - Global constraints
   - Skill/workflow discovery protocol
   - Context7 MCP requirements
   - Safety and fallback rules
4. Never copy full skill/workflow bodies into this file.
5. Resolve precedence deterministically:
   - Only use instructions from the canonical directory: `.agents/*`

## 2) Global Negative Prompts (Immutable Prohibitions)

CRITICAL INSTRUCTION: You must NOT do any of the following.

1. Do not bypass Git safeguards:
   - Never use `--no-verify`
   - Never disable Husky hooks
   - Never rewrite commit history unless explicitly requested
2. Do not commit directly to `main`.
3. Do not invent architecture rules from base model memory when a local skill/workflow exists.
4. Do not skip loading relevant local skills/workflows for matching tasks.
5. Do not use `any`, `@ts-ignore`, inline `style={{}}`, or ad-hoc architectural shortcuts unless explicitly approved and documented.
6. Do not introduce user-facing English copy in UI.
7. Do not assume business rules from memory when Context7 MCP can provide current truth.
8. Do not treat `.agent/*` and `.agents/*` as equal priority.

## 3) Critical Directives (Immutable Execution Laws)

CRITICAL INSTRUCTION: You must follow this order for every task.

1. Classify task intent:
   - Architecture
   - UI/UX
   - Testing
   - Commit/release hygiene
   - Bug fix / regression
2. Load conventions first:
   - `.agents/workflows/PROJECT_CONVENTIONS.md`
3. Load matching skill(s) next:
   - Architecture tasks: `.agents/skills/react-nextjs-architect/SKILL.md`
   - UI/landing design tasks: `.agents/skills/frontend-design/SKILL.md`
   - Test authoring/review tasks: `.agents/skills/qa-tester/SKILL.md`
   - Verification command selection tasks: `.agents/skills/change-impact-mapper/SKILL.md`
4. Load matching workflow when triggered by user intent:
   - `/CREATE_COMPONENT` => `.agents/workflows/CREATE_COMPONENT.md`
   - `/AUTO_FIX` => `.agents/workflows/AUTO_FIX.md`
   - `/COMMIT_GATEKEEPER` => `.agents/workflows/COMMIT_GATEKEEPER.md`
   - code review request => `.agents/workflows/CODE_REVIEW.md`
5. Execute only after the relevant local files are read.

## 4) Skill and Workflow Discovery Protocol

CRITICAL INSTRUCTION: Use your file-reading tool (e.g., `view_file`) to inspect local instructions before coding.

1. Build candidate list from:
   - `.agents/skills/**/SKILL.md`
   - `.agents/workflows/*.md`
2. Match task keywords to candidates.
3. Select minimal set that fully covers the task.
4. Read only required instruction files, not the entire tree.
5. Follow loaded instructions as authoritative over base model defaults.
6. If conflict exists:
   - Highest priority: this `AGENTS.md`
   - Then: `.agents/workflows/PROJECT_CONVENTIONS.md`
   - Then: task-specific workflow
   - Then: skill-specific guidance
7. If unresolved conflict remains, stop and ask for user decision.

## 5) Context7 MCP Mandatory Integration

CRITICAL INSTRUCTION: Before modifying architecture-sensitive layers, query Context7 first.

Architecture-sensitive layers include:

- `app/**` routing, layout, metadata, middleware/proxy integration
- `lib/**` business/domain logic
- `store/**` state contracts
- `types/**` shared contracts
- cross-domain refactors, validation rules, tracking requirements

Required MCP sequence:
1. Call `list_resources` on MCP server `Context7`.
2. Identify relevant resource(s) for task scope (business rules, tracking definitions, project contracts).
3. Call `read_resource` for selected resource(s).
4. Summarize retrieved constraints in your working notes.
5. Apply code/doc changes only after those constraints are mapped.
6. If Context7 is unreachable:
   - Stop architecture-sensitive edits
   - Report blocker
   - Ask for explicit fallback authorization

CRITICAL INSTRUCTION: Do not rely on stale memory for business rules when Context7 can be queried.

## 6) Husky and Commit Boundaries

CRITICAL INSTRUCTION: Respect repository hooks and commit policies.

1. Pre-commit constraints:
   - Branch must not be `main`
   - Branch naming must match allowed prefixes
   - `pnpm lint-staged` must pass
2. Commit message constraints:
   - Conventional Commits via commitlint
3. Pre-push constraints:
   - Commits must be signed and verifiable
4. If hook fails:
   - Route to `/AUTO_FIX` for remediation
   - Re-stage modified files
   - Retry exact commit command
5. Never bypass hook failures.

## 7) Deterministic Routing Examples

1. User asks: "Create a new calculator component with tests"
   - Load `PROJECT_CONVENTIONS`
   - Load `react-nextjs-architect` skill
   - Load `frontend-design` skill
   - Load `/CREATE_COMPONENT` workflow

2. User asks: "Pre-commit failed, fix it"
   - Load `PROJECT_CONVENTIONS`
   - Load `/AUTO_FIX` workflow
   - Optionally load `qa-tester` skill if failing command is test-related

3. User asks: "Prepare and split commits"
   - Load `PROJECT_CONVENTIONS`
   - Load `/COMMIT_GATEKEEPER`
   - Load `change-impact-mapper` skill for minimal safe verification set

4. User asks: "Refactor app routing/business rules"
   - First run Context7 MCP sequence (`list_resources` -> `read_resource`)
   - Then load `react-nextjs-architect`
   - Then execute task-specific workflow

## 8) Output Discipline

CRITICAL INSTRUCTION: In every response, report:

1. Which skills/workflows were loaded and why.
2. Whether Context7 was queried (resource names read).
3. Which verification commands were run.
