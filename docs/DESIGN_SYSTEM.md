# Design System & Styling Guide

**Architecture:** SCSS Modules + Global Tokens.
**Constraint:** No Tailwind CSS. No Inline Styles (except for dynamic coordinates).
**Source of Truth:** `styles/_tokens.scss`.

---

## 1. Global Tokens

All design values are centralized in `styles/_tokens.scss`. We use CSS Custom Properties (Variables) to allow runtime adjustments and semantic theming.

### 1.1 Color Palette

We use a semantic naming convention (`role-context`) rather than descriptive (`blue-500`).

**Brand Identity:**

- **Primary:** `--c-primary` (`#043369`) - Used for Headings, Call to Actions, and active states.
- **Accent:** `--c-accent` (`#fec914`) - High visibility yellow for "Cotizar" buttons and focus rings.

**UI Surfaces:**

- **Background:** `--c-bg` (`#0e243b`) - Deep blue for the main app background.
- **Surface:** `--c-surface` (`#ffffff`) - Cards and modals.
- **Text:**
  - `--c-text`: Main body text (`#111827`).
  - `--c-muted`: Secondary text (`#6b7280`).
  - `--c-text-on-dark`: White text for dark backgrounds.

**Semantic Feedback:**

- **Success:** `--c-success` (Green) / `--c-success-soft` (Bg).
- **Warning:** `--c-warning` (Amber).
- **Error:** `--c-error-text` (Red) / `--c-error-soft`.
- **Special:** `--c-whatsapp` (`#25d366`) specific for the conversion channel.

### 1.2 Typography

**Font Family:** `Geist Sans` (System UI fallback).

**Scale (Mobile First):**

- `--fs-xxs` (10px) to `--fs-4xl` (48px).
- **Hero:** `--fs-hero` uses `clamp(2rem, 3vw + 1rem, 4rem)` for fluid scaling.

### 1.3 Spacing & Radius

**Spacing Scale:**
Based on a `0.25rem` (4px) incremental scale.

- `--sp-1`: 0.25rem
- `--sp-4`: 1rem (Base)
- `--sp-12`: 3rem

**Border Radius:**

- `--radius-sm`: 0.375rem
- `--radius`: 0.75rem (Standard for cards/buttons)
- `--radius-lg`: 1rem

### 1.4 Z-Index Scale

Managed globally to prevent stacking context wars.

- `40`: `--z-sticky-bar` (Mobile bottom bar)
- `50`: `--z-mobile-menu`
- `60`: `--z-header`
- `100`: `--z-modal`

---

## 2. Layout & Rhythm

Defined in `styles/layout/_rhythm.scss` and `_mixins.scss`.

### 2.1 Vertical Rhythm

We use a fluid section padding to maintain consistent breathing room across devices.

- **Variable:** `--section-py` = `clamp(2rem, 6vw, 4.5rem)`.
- **Usage:** Apply the `.section` class to top-level containers.

### 2.2 Containers

- **Mixin:** `@include container;`
- **Behavior:** Width `min(90%, 1200px)` centered with `margin-inline: auto`.

### 2.3 Safe Areas

The system respects mobile safe areas (notch, home indicator) automatically via `globals.scss`.

- `body` has dynamic `padding-bottom` calculation:
  `calc(var(--bottom-bar-h) + env(safe-area-inset-bottom) + var(--sp-2))`

---

## 3. Responsive System

Defined in `styles/_breakpoints.scss`. We follow a **Mobile-First** approach.

### 3.1 Breakpoints (min-width)

| Key | Width | Target Device |
| :--- | :--- | :--- |
| `xxs` | 375px | Small Phones (SE) |
| `xs` | 480px | Large Phones |
| `sm` | 640px | Phablets / Landscape |
| `md` | 768px | Tablets (Portrait) |
| `lg` | 1024px | Laptops / Tablets (Land) |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Wide Screens |

### 3.2 Usage (Mixin)

Use the `respond-to` mixin located in `styles/_mixins.scss`.

```scss
@use "@/styles/mixins" as *;

.card {
  width: 100%;

  @include respond-to('md') {
    width: 50%; // Only applies from 768px upwards
  }
}
