# Playbook 01: Data Core (Activation)

**Status:** ✅ COMPLETED
**Date:** December 7, 2025
**Outcome:** Fail-Open Persistence Active

## 1. Contexto

En la Fase 0 implementamos la lógica **Fail-Open** en el código. El sistema ya "intenta" guardar en base de datos, pero actualmente falla silenciosamente (y reporta el warning) porque no hay credenciales reales.

**Objetivo de esta Fase:** Activar la persistencia real conectando Supabase y asegurando que los datos fluyan correctamente sin romper la experiencia de usuario.

## 2. Tareas Ejecutadas

### 2.1 Infraestructura Supabase (SQL)

- [x]  **Tabla `public.leads`:** Creada con soporte JSONB para `quote_data`.
- [x]  **Seguridad (RLS):** Configurada para escritura exclusiva vía Service Role.

### 2.2 Configuración de Entorno

- [x]  **Fail-Open:** Variables `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` configuradas como `.optional()`. La app no crashea si faltan.

### 2.3 Tipado Estricto (TypeScript)

- [x]  **Solución `never` type:** Se creó `types/database.ts` incluyendo `Relationships: []` en la definición de la tabla, permitiendo que el cliente de Supabase infiera correctamente los tipos de inserción.
- [x]  **Integridad:** `QuoteSnapshot` asegura que el JSON guardado coincida con la validación de Zod.

### 2.4 Monitoreo (Webhooks)

- [x]  **Fire-and-Forget:** Implementado en `lib/monitoring.ts` usando `AbortController` con timeout de 1s para no bloquear la respuesta al usuario.

## 3. Criterios de Éxito (Verificados)

1. **Persistencia Activa:** Los pedidos generados aparecen en la tabla `leads` de Supabase.
2. **Resiliencia Verificada:** El sistema funciona en modo "Solo WhatsApp" si las credenciales fallan.
3. **Snapshot Completo:** El campo `quote_data` almacena la cotización íntegra.`
