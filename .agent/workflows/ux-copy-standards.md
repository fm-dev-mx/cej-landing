---
description: UX validation and copy standards for Spanish UI
---

# UX Copy & Validation Standards

Quick reference for maintaining Spanish UI copy and validation patterns.

## 1. Error Message Patterns

### Calculator Validation

| Field | Message |
|:------|:--------|
| Volume empty | "Ingresa un volumen mayor a 0 m³" |
| Volume max | "Máximo 500 m³ por pedido web." |
| Length/Width min | "Mínimo 10 cm" |
| Area empty | "Ingresa un área mayor a 0 m²" |
| Thickness | "Ingresa un grosor válido (1-200 cm)" |
| Work type | "Selecciona un tipo de trabajo" |
| Generic | "Ingresa las medidas." |

### Lead Form

| Field | Message |
|:------|:--------|
| Name short | "El nombre es muy corto" |
| Phone invalid | "Verifica el número (10 dígitos)" |
| Privacy | "Debes aceptar el aviso de privacidad" |

### System Errors

| Scenario | Message |
|:---------|:--------|
| Network | "No pudimos conectar. Verifica tu conexión e intenta de nuevo." |
| Server | "Hubo un problema. Por favor intenta de nuevo." |

## 2. CTA Labels

| Context | Label |
|:--------|:------|
| Hero | "Cotiza Ahora" |
| Add to cart | "Agregar al Pedido" |
| Checkout | "Finalizar Pedido" |
| Generate ticket | "Generar Ticket" |
| WhatsApp | "Continuar en WhatsApp" |
| View breakdown | "Ver Desglose" |
| Reuse quote | "↺ Reutilizar" |

## 3. SLA Messages

| Condition | Message |
|:----------|:--------|
| Before 4 PM | "Te contactaremos en el transcurso de la próxima hora." |
| After 4 PM | "Te contactaremos a primera hora del siguiente día hábil." |

## 4. Validation Timing

**Hybrid approach:**

1. Initial: No errors shown
2. On blur (touched field): Validate and show error
3. On change (post-touch): Clear error if valid
4. On submit: Validate all, focus first error

**Key rule:** Errors should NEVER appear before user interaction.

## 5. Number Formatting

```tsx
// Volume - always 2 decimals
{volume.toFixed(2)} m³

// Currency - use utility
{fmtMXN(amount)}
```

## 6. Zod Schema Pattern

```typescript
// ❌ Bad: English default
z.number().min(1)

// ✅ Good: Spanish message
z.number().min(1, "Ingresa un valor mayor a 0")
```

## 7. Quick Fixes

// turbo

### Fix English Zod message

1. Search for `.min(` or `.max(` without second argument
2. Add Spanish message as second parameter
3. Run `pnpm test` to verify

### Fix premature errors

1. Check for `touched` state tracking
2. Only show error if `touched[field] && error`
3. Handle blur to set touched state
