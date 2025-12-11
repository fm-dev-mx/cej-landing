# Component Library

**Architecture:** Atomic Design Pattern (Atoms → Molecules)
**Location:** `components/ui/`
**Styling:** SCSS Modules + Global Tokens

---

## 1. Button

**Path:** `components/ui/Button/Button.tsx`

### Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `variant` | `'primary' \| 'secondary' \| 'tertiary' \| 'whatsapp'` | `'primary'` | Visual style |
| `fullWidth` | `boolean` | `false` | Stretch to container width |
| `href` | `string` | - | Renders as `<a>` if provided |
| `isLoading` | `boolean` | `false` | Shows spinner and disables |
| `loadingText` | `string` | - | Text shown during loading |
| `disabled` | `boolean` | `false` | Disabled state |

### Variants

| Variant | Background | Use Case |
|:--------|:-----------|:---------|
| `primary` | Accent yellow (`#fec914`) | Main CTAs, "Cotizar", "Agregar" |
| `secondary` | Transparent + border | Secondary actions, cancel |
| `tertiary` | Transparent | Minimal actions, links |
| `whatsapp` | WhatsApp green (`#25d366`) | WhatsApp conversion buttons |

### States

- **Default:** Base styling per variant
- **Hover:** Transform + shadow enhancement (except disabled)
- **Disabled:** Grayscale filter, reduced opacity, cursor `not-allowed`
- **Loading:** Spinner animation, cursor `wait`
- **Loading + Text:** Inline spinner with `loadingText`

### Usage

```tsx
// Primary CTA
<Button variant="primary" onClick={handleSubmit}>
  Cotizar Ahora
</Button>

// Loading state with text
<Button isLoading loadingText="Procesando...">
  Enviar
</Button>

// Link button
<Button variant="whatsapp" href="https://wa.me/...">
  Contactar
</Button>
```

---

## 2. Input

**Path:** `components/ui/Input/Input.tsx`

### Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `variant` | `'dark' \| 'light'` | `'dark'` | Theme variant |
| `label` | `string` | - | Renders label above input |
| `error` | `boolean \| string` | - | Error state or message |
| `isVolume` | `boolean` | `false` | Compact centered style for volumes |

### Behavior

- **Atom Mode:** No `label` or `error` → renders only `<input>`
- **Molecule Mode:** With `label`/`error` → renders container with label + input + error message

### States

| State | Visual | ARIA |
|:------|:-------|:-----|
| Default | Standard border | - |
| Focus | Accent border + glow | - |
| Error | Red border + bg tint | `aria-invalid="true"` |
| Disabled | Reduced opacity | `disabled` attr |

### Accessibility

- Auto-generates unique `id` via `useId()`
- `aria-describedby` connects input to error message
- Error uses `role="alert"`

### Usage

```tsx
// Dark theme with label
<Input label="Nombre" variant="dark" placeholder="Juan Pérez" />

// With error message
<Input
  label="Teléfono"
  variant="light"
  error="Ingresa un número válido"
  aria-invalid
/>

// Volume input (compact)
<Input type="number" isVolume value="5.5" />
```

---

## 3. Card

**Path:** `components/ui/Card/Card.tsx`

### Compound Components

| Component | Purpose |
|:----------|:--------|
| `Card.Root` | Container with variant styling |
| `Card.Header` | Top section with icon/title |
| `Card.Body` | Main content area (flex grows) |
| `Card.Footer` | Bottom section (sticky) |

### Root Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `variant` | `'glass' \| 'surface' \| 'outline'` | `'surface'` | Visual style |

### Variants

| Variant | Background | Border | Use Case |
|:--------|:-----------|:-------|:---------|
| `glass` | Semi-transparent + blur | White alpha | Dark backgrounds (Hero, Trust) |
| `surface` | Solid white | Gray border | Light sections (FAQ, Social) |
| `outline` | Transparent | White alpha | Minimal emphasis |

### States

- **Default:** Base styling per variant
- **Hover:** Lift effect (`translateY(-4px)`) + enhanced shadow/border

### Usage

```tsx
<Card.Root variant="glass">
  <Card.Header>
    <Icon name="truck" />
    <h3>Envío Rápido</h3>
  </Card.Header>
  <Card.Body>
    <p>Descripción del servicio...</p>
  </Card.Body>
  <Card.Footer>
    <Button variant="secondary">Ver más</Button>
  </Card.Footer>
</Card.Root>
```

---

## 4. Select

**Path:** `components/ui/Select/Select.tsx`

### Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `variant` | `'dark' \| 'light'` | `'dark'` | Theme variant |

### Features

- Custom arrow indicator (decorative, `aria-hidden`)
- Wrapper div for styling control
- Inherits all native `<select>` props

### Usage

```tsx
<Select variant="dark" value={strength} onChange={handleChange}>
  <option value="200">f'c 200</option>
  <option value="250">f'c 250</option>
</Select>
```

---

## 5. SelectionCard

**Path:** `components/ui/SelectionCard/SelectionCard.tsx`

### Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `label` | `string` | **required** | Main text |
| `description` | `string` | - | Secondary text |
| `icon` | `ReactNode` | - | Leading icon |
| `customIndicator` | `ReactNode` | - | Replace radio circle |
| `isSelected` | `boolean` | - | Selection state |

### Accessibility

- Hidden `<input type="radio">` handles focus and keyboard
- Visual indicator is `aria-hidden`
- Works with standard radio group patterns (`name` prop)

### Usage

```tsx
<SelectionCard
  label="Tiro Directo"
  description="Descarga directa del camión"
  icon={<TruckIcon />}
  isSelected={type === 'direct'}
  name="deliveryType"
  value="direct"
  onChange={handleChange}
/>
```

---

## 6. ResponsiveDialog

**Path:** `components/ui/ResponsiveDialog/ResponsiveDialog.tsx`

### Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `isOpen` | `boolean` | **required** | Visibility control |
| `onClose` | `() => void` | **required** | Close handler |
| `title` | `string` | - | Dialog heading |
| `children` | `ReactNode` | **required** | Content |

### Features

- **Portal:** Renders to `document.body` (z-index safe)
- **Scroll Lock:** Uses `useLockBodyScroll` hook
- **Keyboard:** Escape key closes dialog
- **Mobile Handle:** Visual drag indicator

### Accessibility

- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` connects to title
- Close button has `aria-label="Cerrar"`

### Usage

```tsx
<ResponsiveDialog
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Confirmar Pedido"
>
  <FormContent />
</ResponsiveDialog>
```

---

## 7. FeedbackToast

**Path:** `components/ui/FeedbackToast/FeedbackToast.tsx`

### Behavior

- **Automatic:** Triggered when cart drawer opens with items
- **Duration:** 3 seconds auto-dismiss
- **Singleton:** Only one toast at a time

### Accessibility

- Uses `role="status"` for non-intrusive announcement

> **Note:** This is a connected component (reads from `useCejStore`), not a prop-driven atom.

---

## 8. ExpertToggle

**Path:** `components/ui/ExpertToggle/ExpertToggle.tsx`

### Behavior

- Toggles between "Básico" and "+Aditivos" modes
- Connected to `useCejStore.draft.showExpertOptions`

### Accessibility

- Uses `aria-pressed` for toggle state
- Screen reader text via `.sr-only` span

---

## Component Guidelines

### Do's ✅

- Always use semantic variants (`variant="primary"`) over inline styles
- Provide `loadingText` for loading buttons when action context matters
- Use `aria-invalid` with Input error states
- Use Card compound pattern (`Card.Root` + subcomponents)

### Don'ts ❌

- Don't apply inline `background` or `color` styles to components
- Don't skip `variant` prop—always be explicit
- Don't wrap SelectionCard in extra labels (it is a label)
- Don't use FeedbackToast or ExpertToggle as controlled components (they're connected)

---

## Token Reference

Components use tokens from `styles/_tokens.scss`:

| Token | Usage |
|:------|:------|
| `--c-accent` | Primary button bg |
| `--c-primary` | Dark text, focus |
| `--c-error-text` | Error states |
| `--radius` | Button/Card corners |
| `--sp-*` | Spacing scale |
| `--fs-*` | Typography scale |
