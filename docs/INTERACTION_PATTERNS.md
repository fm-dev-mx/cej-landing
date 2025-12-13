# UI Interaction Patterns

**Scope:** Standardized behaviors for forms, feedback, loading, errors, and navigation.
**Source of Truth:** `styles/_forms.scss`, `lib/schemas/*.ts`, Component implementations.
**Related Docs:** [`VALIDATION.md`](./VALIDATION.md), [`COPY_GUIDELINES.md`](./COPY_GUIDELINES.md)

---

## 1. Form Validation Patterns

### 1.1 Validation Strategy (Hybrid)

We use a **hybrid validation approach** to balance immediate feedback with user experience:

| Phase | Trigger | Behavior |
|:------|:--------|:---------|
| **Initial** | Field untouched | No validation, no errors shown |
| **On Blur** | User leaves touched field | Validate, show error if invalid |
| **On Change** | User types in touched field | Clear error if now valid |
| **On Submit** | Form submission | Validate all, focus first error |

> **Important:** Errors should NEVER appear before the user has interacted with a field. A field is "touched" only after receiving focus and losing it (blur event).

### 1.2 Error Display Rules

```text
┌─────────────────────────────────────────┐
│  Label                                  │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │ Input with red border              ││
│  └─────────────────────────────────────┘│
│  ⚠️ Mensaje de error (role="alert")     │
└─────────────────────────────────────────┘
```

**Timing:**

- Error appears only AFTER blur event on touched field
- Error animates in with `slideDown` (0.2s ease-out)
- Error clears immediately when input becomes valid
- Error persists through re-focus until corrected

**Styling:**

- Border: `--c-error-text` or `--c-error-text-on-dark`
- Background: Subtle tint (`--c-error-soft`)
- Focus: Error border maintained, glow uses error color

### 1.3 Input State Machine

```mermaid
stateDiagram-v2
    [*] --> Default
    Default --> Focused: focus
    Focused --> Touched: blur
    Touched --> FocusedTouched: focus
    Touched --> Error: validate (invalid)
    FocusedTouched --> Touched: blur (valid)
    FocusedTouched --> Error: blur (invalid)
    Error --> FocusedError: focus
    FocusedError --> Touched: blur (valid)
    FocusedError --> Error: blur (still invalid)
    Default --> Disabled: disabled=true
```

### 1.4 Error Focus Management

When form submission fails validation:

1. **Find first invalid field** (in DOM order)
2. **Scroll into view** with `behavior: 'smooth'`, `block: 'center'`
3. **Focus the input** programmatically
4. **Announce error** via `role="alert"` on inline error message

**Implementation:**

```tsx
const handleSubmit = () => {
    const result = schema.safeParse(formData);

    if (!result.success) {
        const firstErrorPath = result.error.issues[0]?.path[0];
        const errorElement = document.querySelector(`[name="${firstErrorPath}"]`);

        if (errorElement instanceof HTMLElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorElement.focus();
        }
        return;
    }
    // proceed with submission...
};
```

**Do NOT:**

- Auto-focus back to field on blur error (disruptive to tab navigation)
- Show multiple error dialogs/modals at once
- Block user from submitting if only warnings exist

---

## 2. Loading States

### 2.1 Button Loading

| **Scenario** | **Pattern** | **Visual** |
| --- | --- | --- |
| Quick action (<2s) | Spinner only | Centered spinner, content invisible |
| Long action (>2s) | Spinner + text | Inline spinner with `loadingText` |

**Implementation:**

```tsx
`<Button isLoading>Enviar</Button>           // Spinner only
<Button isLoading loadingText="Guardando...">  // Spinner + text`
```

### 2.2 Loading Feedback Timing

| **Duration** | **User Expectation** | **Pattern** |
| --- | --- | --- |
| 0-300ms | Instant | No indicator needed |
| 300ms-2s | Brief wait | Button spinner |
| 2s-10s | Noticeable wait | Spinner + progress text |
| >10s | Long operation | Consider async pattern |

### 2.3 Skeleton Loading (Future)

> Not yet implemented. Recommended for future phases:
>
> - Calculator form loading
> - Cart item loading
> - Price calculation loading

---

## 3. Feedback Patterns

### 3.1 Feedback Hierarchy

| **Priority** | **Type** | **Component** | **Duration** |
| --- | --- | --- | --- |
| 🔴 Critical | Error (blocking) | Inline message | Persistent |
| 🟡 Warning | Validation issue | Inline + form error | Until fixed |
| 🟢 Success | Action completed | Toast | 3 seconds |
| 🔵 Info | Neutral message | Toast or inline | 3-5 seconds |

### 3.2 Toast Behavior

**Current Implementation:** `FeedbackToast`

| **Property** | **Value** |
| --- | --- |
| Position | Top-right (desktop), Top-center (mobile) |
| Duration | 3 seconds |
| Animation | Slide in from right |
| Stacking | Single toast (replaces previous) |
| Role | `role="status"` (non-assertive) |

### 3.3 Error Message Text Guidelines

| **❌ Don't** | **✅ Do** |
| --- | --- |
| "Invalid input" | "Ingresa un número de 10 dígitos" |
| "Error occurred" | "No pudimos guardar tu pedido. Intenta de nuevo." |
| "Required" | "Este campo es obligatorio" |
| "Bad format" | "Usa el formato: 656 123 4567" |

---

## 4. Form Submission Flow

### 4.1 Standard Flow

```mermaid
sequenceDiagram
    participant User
    participant Form
    participant Button
    participant Action

    User->>Form: Fills fields
    User->>Button: Clicks submit
    Button->>Button: isLoading = true
    Form->>Form: Validate (Zod)

    alt Validation fails
        Form->>Form: Show inline errors
        Button->>Button: isLoading = false
    else Validation passes
        Form->>Action: Submit data

        alt Action succeeds
            Action->>Form: Success response
            Form->>User: Toast + next step
        else Action fails
            Action->>Form: Error response
            Form->>Form: Show error banner
        end
        Button->>Button: isLoading = false
    end
```

### 4.2 Form States

| **State** | **Button** | **Fields** | **Errors** |
| --- | --- | --- | --- |
| Idle | Enabled | Editable | Hidden |
| Invalid | Disabled (optional) | Editable | Visible |
| Submitting | Loading | Disabled | Hidden |
| Error | Enabled | Editable | Visible (summary) |
| Success | - | - | - (redirect/close) |

---

## 5. Modal/Dialog Patterns

### 5.1 Open/Close Behaviors

| **Trigger** | **Behavior** |
| --- | --- |
| Backdrop click | Close modal |
| Escape key | Close modal |
| Close button | Close modal |
| Form submit success | Close modal + feedback |
| Form submit error | Keep open + show error |

### 5.2 Focus Management

1. **On Open:** Focus moves to first focusable element or dialog itself
2. **Trap:** Tab cycles within dialog only
3. **On Close:** Focus returns to trigger element

### 5.3 Scroll Lock

- Body scroll is locked via `useLockBodyScroll` hook
- Prevents background scrolling on mobile
- Restores on unmount

---

## 6. Selection Patterns

### 6.1 Radio Selection (SelectionCard)

| **Interaction** | **Result** |
| --- | --- |
| Click anywhere on card | Selects option |
| Keyboard Enter/Space | Selects focused option |
| Arrow keys | Navigate between options |

**Visual Feedback:**

- Selected: Accent border, subtle background
- Unselected: Muted border
- Focus: Visible focus ring

### 6.2 Toggle (ExpertToggle)

| **State** | **Visual** | **ARIA** |
| --- | --- | --- |
| Off (Básico) | "▸ Agregar Aditivos" | `aria-expanded="false"` |
| On (+Aditivos) | "▾ Ocultar Aditivos" | `aria-expanded="true"` |

---

## 7. Navigation Patterns

### 7.1 Multi-Step Wizard (Calculator)

| **Navigation** | **Behavior** |
| --- | --- |
| Next | Validate current step → advance |
| Back | No validation → go back |
| Step indicator click | Disabled (linear flow) |

### 7.2 Drawer Navigation (QuoteDrawer)

| **Tab** | **Content** |
| --- | --- |
| `order` | Current cart items |
| `history` | Previous orders |

**Tab Switching:** Instant, no animation, content swap.

---

## 8. Responsive Behavior

### 8.1 Dialog Responsiveness

| **Breakpoint** | **Dialog Style** |
| --- | --- |
| Mobile (<768px) | Bottom sheet (swipe up) |
| Desktop (≥768px) | Centered modal |

### 8.2 Bottom Bar Visibility

| **Context** | **Visibility** |
| --- | --- |
| Mobile + cart has items | Visible |
| Mobile + cart empty | Hidden |
| Desktop (any) | Hidden (via CSS) |

---

## 9. Fail-Open UX Pattern

When backend operations fail, prioritize user momentum:

`┌─────────────────────────────────────────────────────────┐
│  USER ACTION → Try Backend → Success? → Continue        │
│                     ↓                                   │
│                   Fail?                                 │
│                     ↓                                   │
│              Log Error (Silent)                         │
│                     ↓                                   │
│              Continue Anyway (Fail-Open)               │
│                     ↓                                   │
│              WhatsApp Handoff (always works)           │
└─────────────────────────────────────────────────────────┘`

**Implementation:** Even if database write fails, user sees success and proceeds to WhatsApp.
