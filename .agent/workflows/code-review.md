---
description: Standardized code review checklist for git diff validation
---

# Code Review Workflow

Checklist for reviewing `git diff --staged` or PR changes in `cej-landing`.

## 1. Quick Commands

// turbo-all

1. Run `git diff --staged --no-color` to view changes
2. Run `pnpm lint` to check linting
3. Run `pnpm test` to verify tests pass

## 2. Language Rules

| Context | Language | Rule |
|:--------|:---------|:-----|
| Code, variables, types | English | All identifiers and comments |
| UI text, labels, messages | Spanish | User-facing strings only |
| Documentation | English | All `.md` files |
| Zod error messages | Spanish | `"Ingresa..."`, `"Verifica..."` |

**Check for violations:**

- English text in JSX that renders to UI
- Default Zod messages (e.g., `z.number().min(1)` without Spanish message)
- Spanish comments in code (should be English)

## 3. TypeScript Standards

- [ ] No `any` in core paths: `lib/pricing.ts`, `store/`, `lib/schemas/`
- [ ] Explicit return types on exported functions
- [ ] Proper interface/type definitions (no inline object types for props)
- [ ] Zod schemas for all user input validation

## 4. SCSS & Styling

- [ ] Uses SCSS Modules only (`.module.scss`)
- [ ] No Tailwind classes
- [ ] No inline styles (except dynamic values like coordinates)
- [ ] Imports tokens: `@use 'styles/tokens' as *;`
- [ ] Uses design tokens (`--c-*`, `--sp-*`, `--radius-*`)

## 5. React & Next.js

- [ ] Components use PascalCase naming
- [ ] Hooks use camelCase with `use` prefix
- [ ] Server components don't use client-only features
- [ ] `'use client'` only where necessary
- [ ] No prop drilling beyond 2 levels (use context or store)

## 6. Accessibility

- [ ] Interactive elements have appropriate ARIA attributes
- [ ] Form inputs have associated labels
- [ ] Error messages use `role="alert"`
- [ ] Focus management on modals/drawers
- [ ] Keyboard navigation works

## 7. Validation & Forms

- [ ] Zod schemas have explicit Spanish messages
- [ ] Errors show only after user interaction (touched state)
- [ ] First invalid field is focused on submit
- [ ] Volume displays use `.toFixed(2)`
- [ ] Currency uses `fmtMXN()` utility

## 8. Tests

- [ ] New features have corresponding tests
- [ ] Tests cover edge cases and error states
- [ ] Mocks are minimal and focused
- [ ] No `console.log` left in test files

## 9. Response Format

### If changes are valid

```
✅ **LGTM** (Code Review Standards Met)

Brief summary of what was reviewed.
```

### If changes need fixes

Return only the corrected files with:

- `## path/to/file.ext` header
- Complete corrected code block
- Brief summary of changes

## 10. Commit Message

Always end with a Conventional Commits message:

```
<type>(<scope>): <description>

- [bullet list of changes]

Refs: [context]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
