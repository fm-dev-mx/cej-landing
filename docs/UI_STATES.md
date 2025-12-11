# UI States Catalog

**Scope:** Empty states, error states, loading states, and system messages.
**Purpose:** Ensure consistent user feedback across all application states.

---

## 1. Empty States

### 1.1 Cart Empty

**Location:** QuoteDrawer (Order Tab)

| Property | Value |
|:---------|:------|
| **Headline** | "Tu pedido está vacío" |
| **Body** | "Usa el cotizador para agregar productos" |
| **Icon** | Shopping cart outline |
| **Action** | None (user navigates to calculator) |

### 1.2 History Empty (Dashboard)

**Location:** QuoteDrawer (History Tab) & `/dashboard`

| Property | Value |
|:---------|:------|
| **Headline** | "Sin historial" |
| **Body** | "Aquí aparecerán tus cotizaciones enviadas" |
| **Icon** | Clock/history outline |
| **Action** | None |

### 1.3 No Results (Filters)

**Location:** Dashboard Search / Date Filter

| Property | Value |
|:---------|:------|
| **Headline** | "No encontramos resultados" |
| **Body** | "Intenta con otros términos o fechas" |
| **Icon** | Search with X |
| **Action** | "Limpiar filtros" (Secondary Button) |

---

## 2. Error States

### 2.1 Field Validation Error

**Location:** Input components

| Property | Value |
|:---------|:------|
| **Visual** | Red border, light red background |
| **Message** | Below input, animated slide-in |
| **ARIA** | `role="alert"`, `aria-invalid="true"` |

**Standard Messages:**

| Field | Error Message |
|:------|:--------------|
| Name | "Ingresa tu nombre completo (mínimo 3 caracteres)" |
| Phone | "Ingresa un número de 10 dígitos" |
| Email | "Ingresa un correo electrónico válido" |
| Volume | "Ingresa un volumen válido" |
| Required | "Este campo es obligatorio" |

### 2.2 Form Submission Error

**Location:** LeadFormModal, forms

| Property | Value |
|:---------|:------|
| **Visual** | Error banner above submit button |
| **Style** | `--c-error-soft` background, `--c-error-text` text |
| **Message** | Descriptive, actionable |
| **Persistence** | Until user retries or corrects |

**Standard Messages:**

| Scenario | Message |
|:---------|:--------|
| Network error | "No pudimos conectar. Verifica tu conexión e intenta de nuevo." |
| Server error | "Hubo un problema. Por favor intenta de nuevo." |
| Auth error | "No pudimos iniciar sesión. Verifica tus credenciales." |

### 2.3 Calculator Error

**Location:** CalculatorForm

| Property | Value |
|:---------|:------|
| **Visual** | Inline error alert |
| **Style** | Dark theme error styling |
| **ARIA** | `role="alert"` |

**Standard Messages:**

| Scenario | Message |
|:---------|:--------|
| Invalid dimensions | "Las dimensiones ingresadas no son válidas" |
| Volume exceeded | "El volumen máximo por cotización es 50 m³" |
| Missing selection | "Selecciona un tipo de trabajo" |

---

## 3. Warning States

### 3.1 Calculator Warnings

**Location:** CalculatorForm (below inputs)

| Property | Value |
|:---------|:------|
| **Visual** | Info note style |
| **Style** | `--c-info-*` tokens |
| **Icon** | Info circle |

**Standard Warnings:**

| Code | Message |
|:-----|:--------|
| `BELOW_MINIMUM` | "Nota: El pedido mínimo es {minM3} m³. Se ajustará el precio." |
| `ROUNDING_POLICY` | "El volumen se ajusta a múltiplos de 0.5 m³." |

---

## 4. Loading States

### 4.1 Button Loading

| Property | Value |
|:---------|:------|
| **Visual** | Spinner replacing/alongside text |
| **Interaction** | Disabled, cursor `wait` |
| **Duration** | Until action completes |

**Variants:**

| Type | Usage |
|:-----|:------|
| Spinner only | Quick actions (<2s expected) |
| Spinner + text | Long actions (show "Procesando...", "Guardando...") |

### 4.2 Auth & Data Loading (Phase 4A)

**Location:** Login Page, Dashboard

| Property | Value |
|:---------|:------|
| **Visual** | Skeleton placeholders or Centered Spinner |
| **Text** | "Verificando sesión...", "Cargando historial..." |
| **Duration** | Until hydration/fetch completes |

---

## 5. Success States

### 5.1 Toast Notification

**Location:** FeedbackToast (global)

| Property | Value |
|:---------|:------|
| **Visual** | Fixed position, slides in |
| **Duration** | 3 seconds auto-dismiss |
| **Icon** | ✅ Checkmark |
| **ARIA** | `role="status"` |

**Standard Messages:**

| Scenario | Title | Subtitle |
|:---------|:------|:---------|
| Add to cart | "Agregado al pedido" | "Tu cálculo se guardó correctamente." |
| Magic Link Sent | "Enlace enviado" | "Revisa tu correo para iniciar sesión." |
| Login Success | "Hola de nuevo" | "Has iniciado sesión correctamente." |

### 5.2 Checkout Success

**Location:** After form submission

| Property | Value |
|:---------|:------|
| **Flow** | Modal closes → WhatsApp opens |
| **Feedback** | Implicit (redirect to WhatsApp) |

---

## 6. Styling Reference

### Dark Theme (Calculator, Dark Sections)

```scss
// Error
--c-error-text-on-dark: #fca5a5;
--c-error-bg-on-dark: rgba(239, 68, 68, 0.1);
--c-error-border-on-dark: rgba(239, 68, 68, 0.2);

// Info/Warning
--c-info-text-on-dark: #93c5fd;
--c-info-bg-on-dark: rgba(14, 165, 233, 0.1);
--c-info-border-on-dark: rgba(14, 165, 233, 0.2);
```

### Light Theme (Forms, Modals)

```scss
// Error
--c-error-text: #b91c1c;
--c-error-soft: #fef2f2;
--c-error-border: #fecaca;

// Success
--c-success: #16a34a;
--c-success-soft: #ecfdf3;

// Warning
--c-warning: #f59e0b;
--c-warning-soft: #fffbeb;
```

---

## 7. Best Practices

### Do's ✅

- Always provide actionable error messages
- Use consistent terminology across the app
- Animate state changes for visual continuity
- Include ARIA attributes for accessibility

### Don'ts ❌

- Don't use generic "Error" or "Something went wrong"
- Don't leave empty states without guidance
- Don't show multiple error types simultaneously
- Don't auto-dismiss critical errors
