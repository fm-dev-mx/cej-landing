# Iconography Guidelines

**Scope:** Icon usage patterns, sizing, accessibility, and consistency.
**Status:** Inline SVG/emoji-based (no dedicated icon library yet)

---

## 1. Current Implementation

The project currently uses:

| Type | Usage | Example |
|:-----|:------|:--------|
| **Emoji** | Decorative indicators | ✅ 🔔 📦 💰 |
| **Inline SVG** | UI controls | Close button (×) |
| **Text symbols** | Simple icons | × (close), ▼ (dropdown) |

---

## 2. Icon Categories

### 2.1 Action Icons

| Icon | Usage | Location |
|:-----|:------|:---------|
| × (close) | Close modal/drawer | ResponsiveDialog, QuoteDrawer |
| ▼ (chevron) | Dropdown indicator | Select, FAQ accordion |
| + | Add action | Cart add |
| − | Remove action | Cart remove |

### 2.2 Status Icons

| Icon | Meaning | Usage |
|:-----|:--------|:------|
| ✅ | Success | Toast, confirmation |
| ⚠️ | Warning | Validation notes |
| ❌ | Error | Error messages |
| ℹ️ | Info | Help text |

### 2.3 Domain Icons

| Icon | Meaning | Context |
|:-----|:--------|:--------|
| 🏗️ | Construction | Work types |
| 🚚 | Delivery | Service type |
| 📦 | Product/Order | Cart, order summary |
| 💰 | Price/Total | Pricing display |
| 📱 | Phone/Contact | WhatsApp |

---

## 3. Sizing Guidelines

### 3.1 Size Scale

| Size | Dimension | Use Case |
|:-----|:----------|:---------|
| `xs` | 12px | Inline with small text |
| `sm` | 16px | Inline with body text |
| `md` | 20px | Buttons, list items |
| `lg` | 24px | Card headers, features |
| `xl` | 32px | Hero sections, empty states |

### 3.2 Implementation

```scss
.icon {
  // Default size
  width: 1.25rem;  // 20px
  height: 1.25rem;

  // Size variants
  &--sm { width: 1rem; height: 1rem; }
  &--lg { width: 1.5rem; height: 1.5rem; }
  &--xl { width: 2rem; height: 2rem; }
}
```

---

## 4. Accessibility

### 4.1 Decorative Icons

Icons that don't convey meaning should be hidden from screen readers:

```tsx
// Emoji (decorative)
<span aria-hidden="true">✅</span>

// SVG (decorative)
<svg aria-hidden="true" focusable="false">...</svg>
```

### 4.2 Meaningful Icons

Icons that convey information need accessible text:

```tsx
// Icon-only button
<button aria-label="Cerrar modal">
  <span aria-hidden="true">×</span>
</button>

// Icon with visible label
<button>
  <span aria-hidden="true">📱</span>
  <span>Contactar</span>
</button>
```

### 4.3 Status Icons

When icons indicate status, provide SR text:

```tsx
<span role="status">
  <span aria-hidden="true">✅</span>
  <span className="sr-only">Éxito:</span>
  Agregado al pedido
</span>
```

---

## 5. Color Guidelines

### 5.1 Icon Colors

| Context | Color Token | Usage |
|:--------|:------------|:------|
| On dark bg | `--c-text-on-dark` | White icons |
| On light bg | `--c-text` | Dark icons |
| Primary action | `--c-accent` | CTA icons |
| Success | `--c-success` | Confirmation |
| Error | `--c-error-text` | Error indicators |
| Muted | `--c-muted` | Secondary actions |

### 5.2 Implementation

```scss
.icon {
  // Inherit text color by default
  color: currentColor;

  // Semantic variants
  &--success { color: var(--c-success); }
  &--error { color: var(--c-error-text); }
  &--muted { color: var(--c-muted); }
}
```

---

## 6. Future Recommendations

### 6.1 Icon Library Options

When scaling the UI, consider adopting:

| Library | Pros | Cons |
|:--------|:-----|:-----|
| **Lucide React** | Tree-shakeable, consistent | Additional dependency |
| **Heroicons** | Tailwind ecosystem | May conflict with SCSS approach |
| **Custom SVG sprites** | Full control | Maintenance overhead |

### 6.2 Recommended Pattern

```tsx
// Future icon component
interface IconProps {
  name: 'close' | 'check' | 'truck' | 'cart';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'aria-hidden'?: boolean;
}

export function Icon({ name, size = 'md', ...props }: IconProps) {
  // Render from sprite or component map
}
```

---

## 7. Quick Reference

### Icon Checklist

- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Icon-only buttons have `aria-label`
- [ ] Icons use `currentColor` for flexibility
- [ ] Sizes follow the standard scale
- [ ] Meaningful icons have SR text alternative

### Do's ✅

- Use semantic emojis for quick visual context
- Keep icon sizing consistent within contexts
- Ensure sufficient color contrast
- Provide text alternatives for meaningful icons

### Don'ts ❌

- Don't rely solely on icons to convey meaning
- Don't use icons without accessible alternatives
- Don't mix icon styles (outline vs filled) inconsistently
- Don't use decorative icons in critical UI feedback
