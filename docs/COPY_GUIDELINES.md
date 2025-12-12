# Copy & Messaging Guidelines

**Scope:** All user-facing text, error messages, success messages, and UI labels.
**Language:** Spanish (informal second person singular).
**Source of Truth:** This document is the canonical reference for all copy.

---

## 1. Voice & Tone

### 1.1 Brand Voice

| Attribute | Description | Example |
|:----------|:------------|:--------|
| **Directo** | Clear, no fluff | "Cotiza tu concreto" not "Bienvenido a nuestra calculadora" |
| **Profesional** | Industry expertise | "f'c 250 kg/cm²" not "concreto fuerte" |
| **Amigable** | Approachable | "¿Necesitas ayuda?" not "Contacte a soporte" |
| **Confiable** | Build trust | "Precio garantizado por 7 días" |

### 1.2 Grammar Rules

- Use **informal "tú"** form: "Ingresa", "Selecciona", "Verifica"
- **Sentence case** for headings: "Cotiza tu concreto", not "COTIZA TU CONCRETO"
- **No periods** in button labels: "Cotizar Ahora" not "Cotizar Ahora."
- **Numbers**: Use digits for measurements, spell out small counts ("3 productos", "5.5 m³")

---

## 2. Error Messages Catalog

### 2.1 Calculator Validation

| Field | Condition | Message |
|:------|:----------|:--------|
| Volume (m³) | Empty/zero | "Ingresa un volumen mayor a 0 m³" |
| Volume (m³) | Exceeds max | "Máximo 500 m³ por pedido web." |
| Volume (m³) | Invalid number | "Debe ser un número válido." |
| Length (m) | Below 10cm | "Mínimo 10 cm" |
| Width (m) | Below 10cm | "Mínimo 10 cm" |
| Area (m²) | Empty/zero | "Ingresa un área mayor a 0 m²" |
| Area (m²) | Invalid | "Ingresa un área válida" |
| Thickness (cm) | Empty/invalid | "Ingresa un grosor válido (1-200 cm)" |
| Work Type | Not selected | "Selecciona un tipo de trabajo" |
| Generic dimensions | Invalid parse | "Las dimensiones ingresadas no son válidas" |
| Generic input | Required empty | "Ingresa las medidas." |

### 2.2 Lead Form Validation

| Field | Condition | Message |
|:------|:----------|:--------|
| Name | Too short | "El nombre es muy corto" |
| Name | Empty | "Ingresa tu nombre completo (mínimo 3 caracteres)" |
| Phone | Too short | "Verifica el número (10 dígitos)" |
| Phone | Invalid format | "Ingresa un número de 10 dígitos" |
| Email | Invalid format | "Ingresa un correo electrónico válido" |
| Privacy checkbox | Unchecked | "Debes aceptar el aviso de privacidad" |

### 2.3 System/Server Errors

| Scenario | Message |
|:---------|:--------|
| Network error | "No pudimos conectar. Verifica tu conexión e intenta de nuevo." |
| Server error | "Hubo un problema. Por favor intenta de nuevo." |
| Auth error | "No pudimos iniciar sesión. Verifica tus credenciales." |
| Generic retry | "Algo salió mal. Intenta de nuevo." |

---

## 3. Warning Messages Catalog

### 3.1 Calculator Warnings

| Code | Condition | Message |
|:-----|:----------|:--------|
| `BELOW_MINIMUM` | Volume < MOQ | "Nota: El pedido mínimo es {minM3} m³. Se ajustará el precio." |
| `ROUNDING_POLICY` | Volume rounded | "El volumen se ajusta a múltiplos de 0.5 m³." |
| `ROUNDING_ADJUSTMENT` | Minor adjustment | (No visible message, implicit) |

---

## 4. Success Messages Catalog

### 4.1 Toast Messages

| Scenario | Title | Subtitle |
|:---------|:------|:---------|
| Add to cart | "Agregado al pedido" | "Tu cálculo se guardó correctamente." |
| Magic link sent | "Enlace enviado" | "Revisa tu correo para iniciar sesión." |
| Login success | "Hola de nuevo" | "Has iniciado sesión correctamente." |
| Quote copied | "Copiado" | "El enlace se copió al portapapeles." |

### 4.2 Inline Success

| Scenario | Message |
|:---------|:--------|
| Quote generated | "✅ Cotización generada: {folio}" |
| Order submitted | "Tu pedido ha sido enviado. Te contactaremos pronto." |

---

## 5. Empty States Catalog

| Location | Headline | Body | Action |
|:---------|:---------|:-----|:-------|
| Cart (Order tab) | "Tu pedido está vacío" | "Usa el cotizador para agregar productos" | "Volver a cotizar" (link) |
| History tab | "Sin historial" | "Aquí aparecerán tus cotizaciones enviadas" | None |
| Dashboard (no results) | "No encontramos resultados" | "Intenta con otros términos o fechas" | "Limpiar filtros" (button) |
| Quote Summary (initial) | "Completa los datos para ver tu cotización" | — | — |

---

## 6. CTA Labels Catalog

### 6.1 Primary Actions

| Context | Label |
|:--------|:------|
| Hero section | "Cotiza Ahora" |
| Calculator submit | "Agregar al Pedido" |
| Cart checkout | "Finalizar Pedido" / "Solicitar Cotización" |
| Lead form submit | "Generar Ticket" |
| WhatsApp handoff | "Continuar en WhatsApp" |

### 6.2 Secondary Actions

| Context | Label |
|:--------|:------|
| View breakdown | "Ver Desglose" |
| Edit item | "Editar" |
| Delete item | "Borrar" |
| Clone/reuse | "↺ Reutilizar" |
| Back/cancel | "Volver" / "Cancelar" |
| Close modal | "Cerrar" |

### 6.3 Planned Actions {PLANNED}

| Context | Label | Status |
|:--------|:------|:-------|
| Call CTA | "Llamar a Ventas" | {PLANNED} |
| Download PDF | "Descargar PDF" | {PLANNED} |
| Share quote | "Compartir" | {PLANNED} |
| Schedule delivery | "Programar Entrega" | {PLANNED} |

---

## 7. Ticket & Quote Labels

### 7.1 Ticket Header

| Element | Label/Format |
|:--------|:-------------|
| Brand | `{BRAND_NAME}` from env |
| Folio (with number) | "Folio: {folio}" |
| Folio (preliminary) | "COTIZACIÓN PRELIMINAR" |
| Date | `{day} de {month} de {year}` (es-MX) |
| Validity | "Vigencia: 7 días" |
| Customer label | "Cliente:" |

### 7.2 Quote Line Items

| Type | Label Pattern |
|:-----|:--------------|
| Base concrete | "Concreto f'c {strength} - {service}" |
| Service (direct) | "Tiro Directo" |
| Service (pumped) | "Bomba" |
| Additive (fibra) | "Fibra de polipropileno" |
| Additive (plastimer) | "Plastimer" |
| Additive (acelerante) | "Acelerante" |

### 7.3 Volume Display

| Context | Format |
|:--------|:-------|
| Requested vs billed | "Solicitado: {x.xx} m³ → Facturado: {y.yy} m³" |
| Single volume | "{x.xx} m³" |
| Volume with service | "{x.xx} m³ · {service}" |

### 7.4 Totals

| Label | Usage |
|:------|:------|
| "Subtotal" | Pre-tax total |
| "IVA ({n}%)" | Tax line |
| "TOTAL" | Grand total (emphasized) |
| "Total Estimado:" | Cart drawer total |

### 7.5 Disclaimers

| Context | Text |
|:--------|:-----|
| Ticket footer | "⚠ Cotización preliminar sujeta a visita técnica." |
| Price warning | "Precios sujetos a cambio sin previo aviso." |
| Volume warning | "Volumetría final sujeta a verificación en obra." |
| Print footer | "Generado en {SITE_URL}" |

---

## 8. SLA & Contact Messages

### 8.1 Contact SLA {SLA_CONTACTO}

| Time of Day | Message |
|:------------|:--------|
| Before 4:00 PM | "Te contactaremos en el transcurso de la próxima hora." |
| After 4:00 PM | "Te contactaremos a primera hora del siguiente día hábil." |

### 8.2 Post-Submission Guidance

| Channel | Message |
|:--------|:--------|
| WhatsApp opened | "Continúa la conversación en WhatsApp para confirmar tu pedido." |
| WhatsApp blocked | "Si WhatsApp no abre, puedes llamarnos al {phone}." |

---

## 9. Placeholders & Hints

| Field | Placeholder | Hint (if any) |
|:------|:------------|:--------------|
| Name | "Juan Pérez" | — |
| Phone | "656 123 4567" | "Formato: 10 dígitos" |
| Volume (m³) | "0.00" | — |
| Length/Width | "0.00" | — |
| Area | "0.00" | "Metros cuadrados" |
| Thickness | "10" | "Centímetros" |

---

## 10. Acceptance Criteria

- [ ] All user-facing text follows this catalog
- [ ] No English text visible in UI
- [ ] All error messages match the exact wording defined here
- [ ] CTAs use the specific labels (not variations)
- [ ] SLA messages display correctly based on time of day

---

## 11. Related Documents

- [`VALIDATION.md`](./VALIDATION.md) — Validation timing and rules
- [`UI_STATES.md`](./UI_STATES.md) — Visual states for messages
- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — Typography and spacing for copy
