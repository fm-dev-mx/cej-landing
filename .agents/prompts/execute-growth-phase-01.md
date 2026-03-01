# Prompt: Implementación del Data Attribution Layer (Phase 2 - Growth)

Actúa como un **Senior Fullstack Engineer**. Tu objetivo es implementar la capa de atribución de datos (ROI Tracking) basándote en el blueprint definido en `.agents/plans/cej-internal-mvp-growth/01-attribution-layer.md`.

### Contexto Estratégico
Necesitamos que cada orden interna (`orders`) guarde de forma persistente los datos de origen (`utm_*`, `fbclid`, `gclid`) para poder calcular el ROI real por canal de marketing. Actualmente, esta información vive parcialmente en el flujo de `leads`, pero no se transfiere de forma robusta a las órdenes internas.

### Tareas de Implementación

1.  **Auditoría de Esquema:**
    *   Verifica la tabla `orders` en `docs/schema.sql` (o inspeccionando el cliente de Supabase).
    *   Si no existen campos para UTMs, prepara las sentencias SQL necesarias para agregar: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` y `fbclid` (usa tipos adecuados, `text` o un `jsonb` unificado).

2.  **Sincronización de Tracking (Middleware/Proxy):**
    *   Revisa `proxy.ts`. Asegura que los parámetros UTM de la URL se capturen y se guarden en cookies (ej. `cej_utm`).
    *   Asegura que estas cookies estén disponibles durante la ejecución de los Server Actions de creación de órdenes.

3.  **Persistencia en Server Actions:**
    *   Modifica `app/actions/createAdminOrder.ts` y `app/actions/submitLead.ts` para que extraigan los datos de atribución (ya sea de las cookies o del payload) y los inserten en la tabla `orders`.
    *   Crea un helper en `lib/logic/attribution.ts` para normalizar estos datos antes de la inserción (ej. convertir a minúsculas, manejar valores por defecto).

4.  **Capa de Analíticas (Baseline):**
    *   Crea una nueva acción `app/actions/getAttributionStats.ts` que agrupe las órdenes y la venta total por `utm_source`.
    *   Esta acción debe ser segura (RBAC check) para roles de `admin` u `owner`.

### Restricciones Técnicas
*   **No rompas el flujo público**: La creación de leads desde el calculador no debe verse afectada.
*   **Principio Dry**: Usa los esquemas de Zod existentes en `lib/schemas/` para validar los nuevos campos de atribución.
*   **Seguridad**: Asegura que los datos de atribución no sean manipulables por el cliente final una vez creada la orden (server-side source of truth).

### Definición de Hecho (DoD)
*   [ ] Un pedido creado con `?utm_source=meta` tiene dicho valor en la base de datos.
*   [ ] Se ha creado un test unitario para el helper de normalización de atribución.
*   [ ] `pnpm typecheck` y `pnpm lint` pasan sin errores.
*   [ ] El archivo `CHANGELOG.md` en la carpeta de Growth ha sido actualizado.

---

**Instrucciones para el Agente:** Comienza leyendo el archivo de plan `01-attribution-layer.md` y luego inspecciona `proxy.ts` para entender cómo se gestionan actualmente las cookies de UTM.
