# Product Roadmap & Sprints

## 1. Strategic Phases

1. **CEJ Landing (Actual):** Captura de tráfico y conversión sin fricción a WhatsApp.
2. **CEJ Cotizador:** Herramienta robusta con carrito multi-ítem, persistencia e historial.
3. **CEJ Pro (SaaS):** Plataforma para contratistas (Gestión de pedidos y facturación).

## 2. Sprint Plan

### ✅ Sprint 1: QA Hardening & Infraestructura (Completado)

*Meta: Eliminar deuda técnica y asegurar integridad matemática.*

- [x]  **Integridad Matemática:** Tests exhaustivos para redondeo, mínimos (MOQ) y precisión flotante.
- [x]  **Arquitectura Fail-Open:** Implementación de `submitLead` resiliente a fallos de BD.
- [x]  **Consolidación UX:** Implementación de `GlobalUI` para visibilidad del carrito en todas las rutas.
- [x]  **Accesibilidad:** Refactor de `SelectionCard` y gestión de foco programático en la Calculadora.
- [x]  **Limpieza:** Eliminación de estilos en línea y tipado estricto (No `any`).

### 🏃 Sprint 2: Data Core & Expert Engine (En Progreso)

*Meta: Persistencia real de datos y lógica avanzada.*

- [x]  **Infraestructura DB:** Provisionar Supabase (`leads`, `price_config`) y activar Server Actions con credenciales reales.
- [x]  **Tipado Estricto BD:** Definición de `types/database.ts` y eliminación de errores de compilación (`never` type).
- [ ]  **Motor Experto (UI):** Habilitar la interfaz para selección de Aditivos (Fibra, Acelerante) y conectarla al store.
- [ ]  **Configuración Dinámica:** Migrar `business.ts` (precios estáticos) a tabla de base de datos con revalidación ISR.

### 🏃 Sprint 3: Authentication & Profiles

*Meta: Identificar usuarios recurrentes.*

- [ ]  Implementar Login/Register con Supabase Auth.
- [ ]  Crear flujos de Onboarding para datos fiscales en `public.profiles`.
- [ ]  Proteger rutas `/app/*` vía Middleware.

### 🏃 Sprint 4: Order Management (SaaS)

*Meta: Profesionalizar la entrega de cotizaciones.*

- [ ]  **Sync Engine:** Migrar carrito local (`localStorage`) a DB (`orders`) al iniciar sesión.
- [ ]  **Ticket Generator:** Endpoint para generar PDF de la cotización.
- [ ]  Construir vista "Mis Pedidos" (Historial en la nube).
