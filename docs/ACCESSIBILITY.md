# Accessibility Guidelines (A11y)

**Standard:** WCAG 2.1 Level AA
**Scope:** CEJ Landing + Calculator + Checkout flows (+ future SaaS Portal)

---

## 1. Current Implementation Status

### 1.1 Implemented Features

| Feature | Status | Location |
| --- | --- | --- |
| Semantic HTML | ✅ | All components |
| `aria-invalid` | ✅ | Inputs, forms |
| `aria-describedby` | ✅ | Inputs → error messages |
| `role="alert"` | ✅ | Error messages |
| `role="dialog"` | ✅ | ResponsiveDialog |
| `role="status"` | ✅ | FeedbackToast |
| `aria-modal` | ✅ | ResponsiveDialog |
| `aria-pressed` | ✅ | ExpertToggle |
| `aria-hidden` | ✅ | Decorative elements |
| `aria-label` | ✅ | Close buttons |
| Focus visible | ✅ | `_forms.scss` styles |
| `prefers-contrast` | ✅ | `_tokens.scss` |
| Screen reader text | ✅ | `.sr-only` class |

### 1.2 Pending Improvements

| Feature | Status | Priority | Notes |
| --- | --- | --- | --- |
| `prefers-reduced-motion` | ✅ | - | Implemented in `globals.scss` |
| Skip links | ❌ | Low | Recommended for Phase 4A |
| Focus trapping (modals) | ⚠️ Partial | High | Needs full focus trap |
| Landmark regions | ⚠️ Partial | Medium | Header/nav/main/footer refinement |
| Color contrast audit | ❌ | High | Systematic check via axe-core |

---

## 2. Accessibility Patterns

### 2.1 Form Fields

**Required Structure:**

```tsx
<Input
  id="nombre"
  label="Nombre"
  error={errorMessage}
  aria-invalid={Boolean(errorMessage)}
/>

```

**ARIA Relationships:**

```text
┌─────────────────────────────────────────┐
│  <label for="field-id">Nombre</label>   │
├─────────────────────────────────────────┤
│  <input                                 │
│    id="field-id"                        │
│    aria-invalid="true"                  │
│    aria-describedby="field-id-error"    │
│  />                                     │
├─────────────────────────────────────────┤
│  <span                                  │
│    id="field-id-error"                  │
│    role="alert"                         │
│  >Texto de error</span>                 │
└─────────────────────────────────────────┘
```

### 2.2 Buttons

| Scenario | Implementation |
| --- | --- |
| Standard button | Native `<button>` |
| Link button | `<a>` with `href` |
| Loading button | `disabled` + `cursor: wait` |
| Icon-only button | `aria-label="Acción"` |

### 2.3 Modals / Dialogs

**Required Attributes:**

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
>
  <h2 id="dialog-title">Título del diálogo</h2>
  <button aria-label="Cerrar">×</button>
  {/* Content */}
</div>

```

**Keyboard Behavior:**

| Key | Action |
| --- | --- |
| `Escape` | Close dialog |
| `Tab` | Cycle forward through focusable elements |
| `Shift+Tab` | Cycle backward through focusable elements |

> The focus trap is currently partial and must be hardened (see §7.1 tasks).
>

### 2.4 Selection Controls

**Radio Groups (SelectionCard):**

```tsx
<fieldset>
  <legend>Selecciona tipo de entrega</legend>
  <SelectionCard
    name="deliveryType"
    value="directo"
    isSelected={selected === "directo"}
  />
  <SelectionCard
    name="deliveryType"
    value="bombeado"
    isSelected={selected === "bombeado"}
  />
</fieldset>

```

**Toggle Buttons (ExpertToggle):**

```tsx
<button
  type="button"
  aria-pressed={isActive}
  title="Modo experto"
>
  <span className="sr-only">
    {isActive ? "Modo experto activado" : "Modo experto desactivado"}
  </span>
</button>

```

---

## 3. Keyboard Navigation

### 3.1 Tab Order

Components should follow logical reading order:

1. Header navigation
2. Main content (`<main id="main-content">`)
3. Calculator form
4. Summary section / ticket
5. Primary CTA
6. Footer

### 3.2 Focus Indicators

**Standard Focus Ring:**

```scss
&:focus-visible {
  outline: none;
  border-color: var(--c-primary);
  box-shadow: 0 0 0 4px var(--c-step-current-soft);
}

```

**Error Focus Ring:**

```scss
&[aria-invalid="true"]:focus-visible {
  border-color: var(--c-error-text);
  box-shadow: 0 0 0 4px var(--c-error-border);
}

```

### 3.3 Skip Links (Recommended)

```tsx
// Add near the top of the main layout component
<a href="#main-content" className="sr-only focus:not-sr-only">
  Saltar al contenido principal
</a>

```

---

## 4. Screen Reader Support

### 4.1 Live Regions

| Type | Usage | ARIA |
| --- | --- | --- |
| Polite | Toast notifications | `role="status"` |
| Assertive | Error messages | `role="alert"` |
| Atomic | Total updates | `aria-live="polite" aria-atomic="true"` |

### 4.2 Hidden Content

**Hide from Screen Readers (decorative):**

```tsx
<span aria-hidden="true">🔔</span>

```

**Hide Visually but Announce:**

```scss
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

```

---

## 5. Color & Contrast

### 5.1 Minimum Requirements

| Element | Ratio | Standard |
| --- | --- | --- |
| Normal text | 4.5:1 | AA |
| Large text (18px+) | 3:1 | AA |
| UI components | 3:1 | AA |
| Focus indicators | 3:1 | AA |

### 5.2 Current Color Pairs

| Background | Foreground | Ratio | Pass |
| --- | --- | --- | --- |
| `#0e243b` (dark bg) | `#ffffff` | 13.4:1 | ✅ |
| `#0e243b` (dark bg) | `#fec914` (accent) | 9.2:1 | ✅ |
| `#ffffff` (light bg) | `#111827` (text) | 16.8:1 | ✅ |
| `#ffffff` (light bg) | `#6b7280` (muted) | 5.9:1 | ✅ |

### 5.3 High Contrast Mode

Implemented in `_tokens.scss`:

```scss
@media (prefers-contrast: more) {
  :root {
    --c-border: #d1d5db;
    --shadow-xs: none;
    --shadow-sm: none;
    --shadow-md: none;
  }
}

```

---

## 6. Motion & Animation

### 6.1 Reduced Motion (✅ Implemented)

**Status:** Implemented in `styles/globals.scss`.

**Implementation:**

```scss
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
```

**Behavior:**

- Disables all CSS animations and transitions globally.
- Sets `scroll-behavior` to `auto` (instant scroll).
- Applies when user has enabled "Reduce motion" in OS accessibility settings.

### 6.2 Animation Guidelines

| Type | Duration | Acceptable |
| --- | --- | --- |
| Micro-interactions | <300ms | ✅ |
| Transitions | 200–500ms | ✅ |
| Loading spinners | Infinite | ✅ (essential only) |
| Auto-playing animations | Any | ❌ (avoid) |

---

## 7. Testing Checklist

### 7.1 Manual Testing

- [ ]  Navigate entire page with keyboard only.
- [ ]  Complete calculator flow without mouse.
- [ ]  Complete checkout / lead submission flow without mouse.
- [ ]  Test with screen reader (NVDA / VoiceOver).
- [ ]  Test with browser zoom at 200%.
- [ ]  Test with high contrast mode.
- [ ]  Verify modal focus trapping (open, tab through, close with Escape).

### 7.2 Automated Testing

| Tool | Purpose |
| --- | --- |
| **axe-core** | DOM accessibility audit (via Playwright) |
| **Lighthouse** | Overall accessibility score and recommendations |
| **WAVE** | Visual overlay of potential issues |

**Playwright A11y Check Example:**

```tsx
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("homepage accessibility", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

```

> Note: axe-core integration is planned for Phase 4A and should be wired into pnpm test:e2e and CI.
>

---

## 8. Component Checklist

### Button

- [x]  Focusable via Tab.
- [x]  Activates on Enter/Space.
- [x]  Disabled state announced by screen reader (via `disabled`).
- [x]  Loading state visible (spinner / text).

### Input

- [x]  Associated visible label.
- [x]  Error linked via `aria-describedby`.
- [x]  `aria-invalid` set on error.

### SelectionCard

- [x]  Keyboard navigable (arrows).
- [x]  Enter/Space selects.
- [x]  Hidden input for screen readers.

### ResponsiveDialog

- [x]  `role="dialog"`.
- [x]  `aria-modal="true"`.
- [x]  Escape closes.
- [ ]  Focus trap (partial – to be improved).

### FeedbackToast

- [x]  `role="status"`.
- [x]  Non-blocking announcement.

### ExpertToggle

- [x]  `aria-pressed`.
- [x]  Screen reader text.
- [x]  Keyboard activatable (Enter/Space).
