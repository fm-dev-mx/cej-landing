---
description: Pre-commit validation checklist to catch common issues
---

# Pre-Commit Workflow

Validation steps before committing code to `cej-landing`.

## 1. Automated Checks

// turbo-all

1. Run `pnpm lint` to check ESLint rules
2. Run `pnpm test` to verify all tests pass

## 2. Language Validation

### UI Text Must Be Spanish

Search for English text in user-facing code:

```bash
# Check for common English patterns in TSX files
grep -r "Click\|Submit\|Cancel\|Error\|Success\|Loading" --include="*.tsx" components/
```

**Valid (Spanish):**

- `"Agregar al Pedido"`
- `"Ingresa un volumen mayor a 0 m³"`
- `"Continuar en WhatsApp"`

**Invalid (English):**

- `"Add to Cart"`
- `"Please enter a valid number"`
- `"Continue"`

### Zod Messages Must Be Spanish

Check for Zod validators without custom messages:

```typescript
// ❌ Bad: uses English default
z.string().min(3)
z.number().min(1)

// ✅ Good: explicit Spanish message
z.string().min(3, "El nombre es muy corto")
z.number().min(1, "Ingresa un valor mayor a 0")
```

## 3. Code Cleanup

- [ ] No `console.log` statements (except in `lib/monitoring.ts`)
- [ ] No commented-out code blocks
- [ ] No `TODO` without issue reference or `{TODO: explanation}`
- [ ] No unused imports (ESLint should catch this)

## 4. Type Safety

- [ ] No `any` types in core paths
- [ ] No `@ts-ignore` without explanation comment
- [ ] No implicit `any` from missing type annotations

## 5. Styling Check

- [ ] No inline `style={{}}` props (except dynamic values)
- [ ] No Tailwind classes
- [ ] SCSS uses design tokens (`var(--c-*)`, `var(--sp-*)`)

## 6. Number Formatting

- [ ] Volume values use `.toFixed(2)`
- [ ] Currency values use `fmtMXN()` utility

## 7. Commit Message Format

Use Conventional Commits:

```text
<type>(<scope>): <short description>

<optional body>

<optional footer>
```

### Types

| Type | Use For |
|:-----|:--------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons |
| `refactor` | Code change that neither fixes nor adds |
| `test` | Adding or updating tests |
| `chore` | Build, deps, configs |

### Examples

```text
feat(calculator): add volume rounding warning message

fix(validation): use Spanish message for phone field

docs: update COMPONENT_LIBRARY with QuoteSummary

refactor(store): extract history logic to separate slice

test(pricing): add edge cases for minimum volume
```

## 8. Final Checklist

Before running `git commit`:

- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] No English UI text
- [ ] No console.log statements
- [ ] Commit message follows Conventional Commits
- [ ] Related docs updated (if applicable)

## 9. Quick Fix Commands

// turbo

```bash
# Auto-fix lint issues
pnpm lint --fix

# Run only affected tests
pnpm test --changed
```
