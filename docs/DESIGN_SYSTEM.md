# Design System & Styling Guide

**Architecture:** SCSS Modules + Global Tokens
**Constraint:** No Tailwind CSS. No inline styles (except for dynamic coordinates).
**Source of Truth:** `styles/_tokens.scss`.
**UI Language:** Spanish (all visible text and labels).

---

## 1. Global Tokens

All design values are centralized in `styles/_tokens.scss`. We use CSS Custom Properties (variables) to allow runtime adjustments and semantic theming.

### 1.1 Color Palette

We use a semantic naming convention (`role-context`) rather than descriptive (`blue-500`).

**Brand Identity:**

- **Primary:** `--c-primary` (`#043369`) – Headings, primary CTAs, active states.
- **Accent:** `--c-accent` (`#fec914`) – High-visibility yellow for "Cotizar" buttons and focus rings.

**UI Surfaces:**

- **Background:** `--c-bg` (`#0e243b`) – Deep blue for main app background.
- **Surface:** `--c-surface` (`#ffffff`) – Cards and modals.
- **Text:** `--c-text` (`#111827`) – Main body text.
- **Muted:** `--c-muted` (`#6b7280`) – Secondary text.
- **Text On Dark:** `--c-text-on-dark` – White text for dark backgrounds.

**Semantic Feedback:**

- **Success:** `--c-success` / `--c-success-soft`.
- **Warning:** `--c-warning`.
- **Error:** `--c-error-text` / `--c-error-soft`.
- **Special:** `--c-whatsapp` (`#25d366`) – Specific to the primary conversion channel.

---

### 1.2 Typography

**Font Family:**

- `Geist Sans`, with system UI fallback.

**Scale (Mobile First):**

Tokenized sizes (examples):

- `--fs-xxs` (10px)
- `--fs-xs` (12px)
- `--fs-sm` (14px)
- `--fs-base` (16px)
- `--fs-lg` (18px)
- `--fs-xl` (20px)
- `--fs-2xl` (24px)
- `--fs-3xl` (30px)
- `--fs-4xl` (48px)

**Hero Heading:**

- `--fs-hero` uses `clamp(2rem, 3vw + 1rem, 4rem)` for fluid scaling.

**Content Rules:**

- All UI strings must be written in **Spanish** even though the code and docs are in English.
- Prefer concise, action-oriented labels (e.g. “Cotizar ahora”, “Ver resumen de cotización”).

---

### 1.3 Spacing & Radius

**Spacing Scale:**

Based on a `0.25rem` (4px) incremental scale.

- `--sp-1`: 0.25rem
- `--sp-2`: 0.5rem
- `--sp-3`: 0.75rem
- `--sp-4`: 1rem (base)
- `--sp-6`: 1.5rem
- `--sp-8`: 2rem
- `--sp-12`: 3rem

**Border Radius:**

- `--radius-sm`: 0.375rem
- `--radius`: 0.75rem (standard for cards/buttons)
- `--radius-lg`: 1rem (hero cards, modals)

---

### 1.4 Z-Index Scale

Managed globally to prevent stacking-context conflicts.

- `--z-sticky-bar`: 40 (mobile bottom bar)
- `--z-mobile-menu`: 50
- `--z-header`: 60
- `--z-modal`: 100

---

## 2. Layout & Rhythm

Defined in `styles/layout/_rhythm.scss` and `_mixins.scss`.

### 2.1 Vertical Rhythm

We use a fluid section padding to maintain consistent breathing room across devices.

- Variable: `--section-py = clamp(2rem, 6vw, 4.5rem)`.
- Usage: Apply the `.section` class to top-level layout containers.

### 2.2 Containers

- Mixin: `@include container;`
- Behavior: `width: min(90%, 1200px); margin-inline: auto;`

### 2.3 Safe Areas

Mobile safe areas (notch, home indicator) are handled automatically via `globals.scss`.

```scss
body {
  padding-bottom: calc(
    var(--bottom-bar-h) +
    env(safe-area-inset-bottom) +
    var(--sp-2)
  );
}

```

---

## 3. Responsive System

Defined in `styles/_breakpoints.scss`. We follow a **mobile-first** approach.

### 3.1 Breakpoints (min-width)

| Key | Width | Target Device |
| --- | --- | --- |
| `xxs` | 375px | Small phones (SE) |
| `xs` | 480px | Large phones |
| `sm` | 640px | Phablets / landscape |
| `md` | 768px | Tablets (portrait) |
| `lg` | 1024px | Laptops / tablets (landscape) |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Wide screens |

### 3.2 Usage (Mixin)

```scss
@use "@/styles/mixins" as *;

.card {
  width: 100%;

  @include respond-to("md") {
    width: 50%; // Applies from 768px upwards
  }
}

```

---

## 4. Motion & Animation

Standardized timing, easing, and animation patterns for consistent UX.

### 4.1 Duration Tokens

| Token | Duration | Use Case |
| --- | --- | --- |
| `--duration-instant` | 100ms | Micro-interactions (hover, focus) |
| `--duration-fast` | 200ms | Transitions, error reveal |
| `--duration-normal` | 300ms | Modals, drawers, panels |
| `--duration-slow` | 400ms | Complex animations, toasts |

### 4.2 Easing Curves

| Name | Value | Use Case |
| --- | --- | --- |
| `ease-out` | `ease-out` | Elements entering (default) |
| `ease-in-out` | `ease-in-out` | Elements moving |
| `spring` | `cubic-bezier(0.16, 1, 0.3, 1)` | Bouncy, natural motion |
| `linear` | `linear` | Spinners, infinite loops |

### 4.3 Animation Patterns

**Entry Animations:**

| Pattern | Duration | Easing | Usage |
| --- | --- | --- | --- |
| `fadeIn` | 200ms | ease-out | Backdrops, overlays |
| `slideUp` | 300ms | spring | Bottom sheets, modals |
| `slideLeft` | 300ms | spring | Side drawers |
| `scaleIn` | 200ms | ease-out | Desktop modals |

**Micro-interactions:**

| Pattern | Duration | Easing | Usage |
| --- | --- | --- | --- |
| `spin` | 600ms | linear | Loading spinners |
| `slideDown` | 200ms | ease-out | Error messages |

### 4.4 Implementation Examples

```scss
// Standard transition
.element {
  transition: all 0.2s ease-out;
}

// Entry animation
.modal {
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

// Loading spinner
.spinner {
  animation: spin 0.6s linear infinite;
}

```

### 4.5 Reduced Motion Support

**Status:** Backlog (`A11y-02` – global reduced motion support)

**Requirement:** All animations must respect the user's OS preference using the following global pattern (to be implemented in the global styles layer, e.g. `styles/globals.scss`):

```scss
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

```

**Implementation Notes:**

- Use duration tokens (`-duration-*`) instead of hard-coded timings in components.
- Avoid long, decorative animations that cannot be disabled when `prefers-reduced-motion` is enabled.
- Once implemented:
  - Update `docs/ACCESSIBILITY.md#6-motion--animation` to mark A11y-02 as implemented.
  - Add an entry in `CHANGELOG.md` under the corresponding version.

---

## 5. Shadows

Defined in `styles/_tokens.scss`.

### 5.1 Shadow Scale

| Token | Value | Use Case |
| --- | --- | --- |
| `--shadow-xs` | `0 1px 1px rgba(15, 23, 42, 0.04)` | Subtle depth |
| `--shadow-sm` | `0 1px 2px rgba(15, 23, 42, 0.06)` | Cards (default) |
| `--shadow-md` | `0 4px 12px rgba(15, 23, 42, 0.08)` | Cards (hover), dropdowns |
| `--shadow-xl` | `0 25px 50px -12px rgba(0, 0, 0, 0.25)` | Modals, dialogs |

### 5.2 Usage Guidelines

- Cards: `-shadow-sm` default, `-shadow-md` on hover.
- Modals: `-shadow-xl`.
- Buttons: Primary uses a custom glow (`0 4px 15px rgba(254, 201, 20, 0.3)`).
- High Contrast: Shadows removed via `prefers-contrast: more`.

---

## 6. Responsive Component Behavior

How components adapt across breakpoints.

### 6.1 Layout Adaptations

| Component | Mobile (<768px) | Desktop (≥768px) |
| --- | --- | --- |
| Header | Compact (64px) | Expanded (100px) |
| Bottom Bar | Visible (72px) | Hidden |
| Dialog | Bottom sheet (full width) | Centered modal |
| Drawer | Full height | Fixed width (≈400px) |

### 6.2 Component-Specific Behavior

**Header:**

```scss
:root {
  --header-h: 80px;        // Mobile
  --header-h-stuck: 64px;  // Scrolled
}

@include respond-to("md") {
  :root {
    --header-h: 100px;       // Desktop
    --header-h-stuck: 80px;
  }
}

```

**Bottom Bar:**

```scss
:root {
  --bottom-bar-h: 72px; // Mobile: visible
}

@include respond-to("md") {
  :root {
    --bottom-bar-h: 0px; // Desktop: hidden
  }
}

```

### 6.3 Grid Patterns

**RAM Pattern (Repeat Auto Minmax):**

```scss
@mixin grid-ram($min-width: 260px, $gap: var(--sp-4)) {
  display: grid;
  gap: $gap;
  grid-template-columns: repeat(
    auto-fit,
    minmax(min(100%, $min-width), 1fr)
  );
}

```

**Usage Examples:**

- Service cards: `@include grid-ram(280px)`.
- Feature cards: `@include grid-ram(200px)`.
- FAQ items: Single column.

### 6.4 Typography Scaling

| Element | Mobile | Desktop |
| --- | --- | --- |
| Hero heading | `--fs-3xl` (≈30px) | `--fs-hero` (clamp to ≈64px) |
| Section heading | `--fs-2xl` (≈24px) | `--fs-3xl` (≈30px) |
| Body text | `--fs-base` (16px) | `--fs-base` (16px) |

---

## 7. Component Quick Reference

For detailed props and usage, see `docs/COMPONENT_LIBRARY.md`.

| Component | Variants | Responsive |
| --- | --- | --- |
| Button | primary, secondary, tertiary, whatsapp | No |
| Input | dark, light | No |
| Card | glass, surface, outline | No |
| Select | dark, light | No |
| SelectionCard | – | No (layout), but keyboard friendly |
| ResponsiveDialog | – | Yes (sheet vs modal) |
| SmartBottomBar | – | Yes (mobile only) |

**Copy guidelines (all components):**

- Labels and CTAs in Spanish.
- Use sentence case (e.g. `Cotiza tu concreto`, not `COTIZA TU CONCRETO`).
- Error messages should be concise and action-oriented.
