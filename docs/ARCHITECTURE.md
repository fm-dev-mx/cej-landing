# Technical Architecture

## 1. Technology Stack

La arquitectura prioriza el rendimiento del lado del cliente (Core Web Vitals) y la seguridad del lado del servidor.

- **Framework:** **Next.js 16** (App Router).
- **Language:** **TypeScript 5.9** (Strict Mode).
- **Styling:** **SCSS Modules** usando un sistema centralizado de Tokens (`_tokens.scss`) y Mixins.
- **State Management:** **Zustand v5** con middleware `persist`.
- **Backend:** **Supabase** (PostgreSQL) integrado exclusivamente vía **Server Actions**.
- **Validation:** **Zod** para inputs de formularios, payloads de API y variables de entorno.
- **Monitoring:** Abstracción ligera (`lib/monitoring.ts`) para reporte de errores sin bloquear la UI.

## 2. Patterns & Strategies

### The "Fail-Open" Logic (Lead Capture)

El sistema está diseñado para capturar el lead incluso si la base de datos falla, asegurando que el usuario siempre sea redirigido a WhatsApp para cerrar la venta.

```mermaid
sequenceDiagram
    participant User as Visitor
    participant UI as Calculator (Client)
    participant Server as Server Action
    participant Monitoring as lib/monitoring
    participant DB as Supabase
    participant WA as WhatsApp

    User->>UI: Input data & Click "Finalizar"
    UI->>Server: submitLead(Payload)

    rect rgb(240, 255, 240)
        Note right of Server: Persistence Attempt
        Server->>DB: INSERT into leads
        alt DB Fails
            DB-->>Server: Error / Timeout
            Server->>Monitoring: Log Error (Non-blocking)
            Server-->>UI: Returns { success: true, warning: 'db_failed' }
        else DB Success
            DB-->>Server: ID Created
            Server-->>UI: Returns { success: true, id: ... }
        end
    end

    Note over UI: UI always redirects
    UI->>WA: Generates URL & Opens WhatsApp`
```

### Marketing Ops: Event Deduplication Flow

Para garantizar la medición precisa en Meta Ads (iOS 14+), utilizamos un modelo híbrido Browser + Server (CAPI).

1. **Client:** Genera un `event_id` único (UUID) al iniciar el checkout.
2. **Pixel:** Envía evento `Lead` al navegador con ese `event_id`.
3. **Server:** Recibe el payload con el `event_id` y lo envía a Meta CAPI via `submitLead`.
4. **Meta:** Deduplica ambos eventos usando el ID compartido, mejorando la calidad de la coincidencia.

### The "Global UI" Pattern

Para evitar la fragmentación de estado entre las páginas de Marketing (`/`) y la Aplicación (`/cotizador`), los componentes de feedback visual del carrito se inyectan en el `RootLayout`.

- **Componente:** `components/GlobalUI.tsx`
- **Ubicación:** `app/layout.tsx`
- **Responsabilidad:** Manejar `QuoteDrawer`, `SmartBottomBar` y `FeedbackToast` de forma persistente en toda la navegación.

## 3. Directory Structure

```tsx
├── app/
│   ├── (marketing)/      # Landing pages públicas.
│   ├── (app)/            # Rutas funcionales (/cotizador).
│   ├── actions/          # Server Actions (submitLead.ts). Único punto de escritura.
│   └── layout.tsx        # Root Layout + GlobalUI.
├── components/
│   ├── Calculator/       # Lógica compleja de dominio.
│   │   ├── steps/        # Sub-componentes refactorizados (Forms, ModeSelector).
│   ├── GlobalUI.tsx      # Orquestador de componentes flotantes.
│   ├── ui/               # Átomos reutilizables (Buttons, Inputs).
├── lib/
│   ├── monitoring.ts     # Capa de abstracción para logging.
│   ├── pricing.ts        # Motor de precios (Consume config/business.ts como fallback).
│   └── schemas/          # Esquemas Zod (Pricing, Orders).
└── store/                # Zustand Stores (Persisted).
```

## 4. Development Standards

1. **Server Actions First:** No crear API Routes. Usar `use server` en `app/actions/`.
2. **Fail-Open UX:** Caminos críticos (Enviar Pedido) nunca deben bloquear al usuario si un servicio secundario falla.
3. **Strict Typing:** Usar `z.infer` para mantener sincronizados los tipos de TypeScript con los validadores de runtime.
4. **Single Source of Truth:** `config/business.ts` es el fallback actual, pero la arquitectura está lista para hidratarse desde DB.
