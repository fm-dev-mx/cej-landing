# Playbook 01: Data Core (Activation)

**Status:** Ready for Execution
**Pre-requisitos:** Fase 0 (QA Hardening) completada. Código de `submitLead.ts` ya implementado.

## 1. Contexto

En la Fase 0 implementamos la lógica **Fail-Open** en el código. El sistema ya "intenta" guardar en base de datos, pero actualmente falla silenciosamente (y reporta el warning) porque no hay credenciales reales.

**Objetivo de esta Fase:** Activar la persistencia real conectando Supabase y asegurando que los datos fluyan correctamente sin romper la experiencia de usuario.

## 2. Tareas de Ejecución

### 2.1 Infraestructura Supabase (SQL)

Ejecutar el script `bd.sql` (actualizado) en el Dashboard de Supabase para crear las tablas necesarias.

- [ ]  **Tabla `public.leads`:** Asegurar que soporte el campo JSONB `quote_data` y las columnas de tracking (`fb_event_id`, `visitor_id`).
- [ ]  **Seguridad (RLS):** Verificar que la tabla `leads` no sea escribible públicamente (solo vía Service Role).

### 2.2 Configuración de Entorno

Actualizar las variables de entorno en Vercel y local (`.env.local`).

- [ ]  `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto.
- [ ]  `SUPABASE_SERVICE_ROLE_KEY`: **CRÍTICO.** Esta llave nunca debe exponerse al cliente (sin prefijo `NEXT_PUBLIC_`). Es necesaria para que `submitLead` funcione.

### 2.3 Validación de Datos (Data Integrity)

Verificar que el JSON guardado en `leads` coincida con el esquema esperado por futuras fases.

- **Prueba:** Realizar un pedido de prueba.
- **Validación:** 1. Revisar en Supabase que se creó una nueva fila.
2. Verificar que `quote_data` contiene el snapshot completo (precios, items, desglose).
3. Verificar que `privacy_accepted` es `true`.

### 2.4 Monitoreo (Sentry / Slack)

Actualizar `lib/monitoring.ts` para conectar con un servicio real.

- [ ]  Reemplazar el `console.error` actual con un hook real (ej. Webhook a Slack o Sentry Capture).
- **Nota:** Si el presupuesto no permite Sentry aún, configurar un canal de Slack para alertas de "DB Down" es suficiente por ahora.

## 3. Criterios de Éxito (Exit Criteria)

1. **Persistencia Activa:** Los pedidos generados en la Landing Page aparecen en la tabla `leads` de Supabase en tiempo real.
2. **Resiliencia Verificada:** Si se revocan las credenciales de Supabase intencionalmente, el flujo de usuario **sigue funcionando** (llega a WhatsApp) y se registra una alerta en el sistema de monitoreo.
3. **Snapshot Completo:** El campo `quote_data` permite reconstruir la cotización exacta sin depender de `business.ts`.
