# Validation Rules & Error Handling

**Scope:** Form validation timing, error display patterns, focus management, and field-level rules.
**Source of Truth:** `lib/schemas/*.ts`, Component implementations.
**UI Language:** Spanish (all error messages).

---

## 1. Validation Strategy

### 1.1 Timing: Hybrid Approach

We use a **hybrid validation strategy** that balances immediate feedback with user experience:

| Phase | Trigger | Behavior |
|:------|:--------|:---------|
| **Initial** | Field untouched | No validation, no errors shown |
| **On Blur** | User leaves field | Validate only if field was modified (`touched`) |
| **On Submit** | Form submission | Validate all fields, focus first error |
| **On Change (post-touch)** | User types in touched field | Clear error if now valid |

### 1.2 "Touched" State Definition

A field is considered **touched** when:

1. User has focused AND blurred the field at least once, OR
2. User has submitted the form (all fields become touched)

**Implementation Pattern:**

```tsx
const [touched, setTouched] = useState<Record<string, boolean>>({});

const handleBlur = (field: string) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
};

// Only show error if field is touched AND has validation error
const showError = touched[field] && !!validationError;
```

### 1.3 Premature Error Prevention

**❌ Anti-pattern (current issue):**

```tsx
// Shows error immediately, even before user finishes typing
if (length || width || inputThickness) {
    error = parse.error.issues[0]?.message;
}
```

**✅ Correct pattern:**

```tsx
// Only show error if field was touched (blur event occurred)
if (touched[field] && !parse.success) {
    error = parse.error.issues[0]?.message;
}
```

---

## 2. Focus Management on Errors

### 2.1 On Submit Error

When form submission fails validation:

1. **Identify first invalid field** (in DOM order)
2. **Scroll field into view** with smooth behavior
3. **Focus the input** programmatically
4. **Announce error** via `role="alert"` on error message

**Implementation:**

```tsx
const handleSubmit = () => {
    const result = schema.safeParse(formData);

    if (!result.success) {
        const firstErrorField = result.error.issues[0]?.path[0];
        const element = document.querySelector(`[name="${firstErrorField}"]`);

        if (element instanceof HTMLElement) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();
        }
        return;
    }
    // proceed...
};
```

### 2.2 On Blur Error

When a field loses focus with invalid value:

- ❌ Do NOT auto-focus back to the field (disruptive)
- ✅ Show inline error message
- ✅ Keep visual error state until corrected

---

## 3. Field Validation Rules

### 3.1 Calculator Fields

| Field | Schema | Min | Max | Error Message (Spanish) |
|:------|:-------|:----|:----|:------------------------|
| `m3` (known volume) | `numericString` | 0.01 | 500 | "Ingresa un volumen mayor a 0 m³" / "Máximo 500 m³ por pedido web." |
| `length` | `numericString` | 0.1 (10cm) | 1000 | "Mínimo 10 cm" |
| `width` | `numericString` | 0.1 (10cm) | 1000 | "Mínimo 10 cm" |
| `area` | `numericString` | 1 | 20000 | "Ingresa un área mayor a 0 m²" |
| `thickness` (dims) | `numericString` | 1 | 200 | "Ingresa un grosor válido (1-200 cm)" |
| `thickness` (area) | `numericString` | 1 | 200 | "Ingresa un grosor válido (1-200 cm)" |

### 3.2 Lead Form Fields

| Field | Schema | Rule | Error Message (Spanish) |
|:------|:-------|:-----|:------------------------|
| `name` | `string` | min 3 chars | "El nombre es muy corto" |
| `phone` | `string` | min 10 digits | "Verifica el número (10 dígitos)" |
| `privacyAccepted` | `literal(true)` | must be true | "Debes aceptar el aviso de privacidad" |

---

## 4. Number Formatting Rules

### 4.1 Volume Display

| Context | Decimal Places | Example |
|:--------|:---------------|:--------|
| `requestedM3` (user input) | 2 fixed | `3.50 m³` |
| `billedM3` (rounded/adjusted) | 2 fixed | `4.00 m³` |
| Volume in WhatsApp message | 2 fixed | `4.00 m³` |
| Volume in ticket summary | 2 fixed | `4.00 m³` |

**Implementation:**

```tsx
// Always use .toFixed(2) for volume display
<span>{quote.volume.requestedM3.toFixed(2)} m³</span>
```

### 4.2 Currency Display

All monetary values use `fmtMXN()` from `lib/utils.ts`:

- Format: `$X,XXX.XX MXN`
- Always 2 decimal places
- Thousands separator: comma

---

## 5. Error Message Guidelines

### 5.1 Message Structure

Follow the pattern: **[Acción] + [Contexto específico]**

| ❌ Generic | ✅ Specific |
|:-----------|:------------|
| "Invalid input" | "Ingresa un número de 10 dígitos" |
| "Error" | "No pudimos guardar tu pedido. Intenta de nuevo." |
| "Required" | "Este campo es obligatorio" |
| "Number must be greater than or equal to 1" | "Ingresa un área mayor a 0 m²" |

### 5.2 Language Rules

- **All error messages MUST be in Spanish**
- Use second person singular informal ("Ingresa", "Verifica", not "Ingrese")
- Be constructive: tell user what TO DO, not just what's wrong

---

## 6. Zod Schema Best Practices

### 6.1 Always Provide Custom Messages

```typescript
// ❌ Bad: uses Zod default (English)
z.number().min(1)

// ✅ Good: explicit Spanish message
z.number().min(1, "Ingresa un valor mayor a 0")
```

### 6.2 Use `errorMap` for Complex Cases

```typescript
z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar el aviso de privacidad" }),
})
```

---

## 7. Acceptance Criteria

- [ ] No error messages appear before user interacts with a field
- [ ] All error messages are in Spanish
- [ ] First invalid field is focused on form submit
- [ ] Error messages are announced to screen readers (`role="alert"`)
- [ ] Volume values always display with 2 decimal places
- [ ] Zod schemas never use default English messages for user-facing validation

---

## 8. Related Documents

- [`INTERACTION_PATTERNS.md`](./INTERACTION_PATTERNS.md) — Form submission flows
- [`UI_STATES.md`](./UI_STATES.md) — Error state styling
- [`COPY_GUIDELINES.md`](./COPY_GUIDELINES.md) — Full message catalog
