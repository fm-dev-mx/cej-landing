# Prompt de Implementación: Roadmap Post-Auditoría (Prioridades P1)

Este documento contiene el prompt estructurado para iniciar la fase de ejecución técnica basada en los resultados de la **Auditoría v3 (2026-02-27)**.

---

## 🤖 Prompt para el Agente

### Role
Eres un **Arquitecto Senior de Next.js** y **Especialista en Conversión (CRO)**. Tu objetivo es resolver la deuda técnica crítica y mejorar la experiencia de usuario (UX) en el embudo de conversión del proyecto `cej-landing`.

### Contexto
La **Auditoría v3** confirmó que el 86% de los "Quick Wins" están implementados. Sin embargo, existen 4 bloqueadores de alta prioridad (P1) que impiden la alineación completa con el `v1-architecture-blueprint`.

### Objetivo: Ejecutar Roadmap P1
Implementa las siguientes cuatro tareas siguiendo la arquitectura (`docs/ARCHITECTURE.md`) y estándares de diseño (`docs/DESIGN_SYSTEM.md`) del proyecto:

#### 1. Limpieza de Root Layout (Arquitectura)
Mueve los proveedores globales y scripts de seguimiento fuera de `app/layout.tsx` y desplázalos a los layouts de grupo correspondientes:
- **`app/(public)/layout.tsx`**: Mueve `GlobalUI`, `PageViewTracker` y el `<Script>` del Meta Pixel aquí.
- **`app/(admin)/layout.tsx`**: Mueve `AuthProvider` aquí.
- **`app/layout.tsx`**: Debe contener únicamente `<html>`, `<body>` y metadatos/fuentes realmente globales.

#### 2. Consolidación de Sistemas UTM (Deuda Técnica)
El sistema actual tiene lógica dual de UTM. Depreca el sistema antiguo (client-side) en favor del nuevo sistema basado en cookies de `proxy.ts`:
- Elimina `hooks/useAttribution.ts`.
- Elimina `lib/tracking/utm.ts`.
- Actualiza los componentes que usaban estos hooks para que lean de la cookie `cej_utm` si es necesario, o confíen en la identificación CAPI del servidor.

#### 3. Validación Estricta en Formulario (UX/Conversión)
Implementa el patrón de validación "Strict-on-Blur" en `components/Calculator/modals/SchedulingModal.tsx`:
- Los campos solo deben mostrar estados de error **después** de que el usuario los haya marcado como "tocado" (`onBlur`).
- El botón de "Enviar" debe permanecer deshabilitado hasta que el formulario sea válido.
- Utiliza la lógica de `validation.ts` existente pero mejora el *timing* del feedback visual.

#### 4. Test de Seguridad CAPI para Administradores (Calidad)
Refuerza las salvaguardas de tracking en el dashboard:
- Actualiza `components/Calculator/modals/createAdminOrder.test.ts`.
- Añade una aserción explícita (mock check) para verificar que `sendToMetaCAPI` **NO** sea llamado cuando un administrador crea un pedido manualmente.

### Restricciones Técnicas
- **Framework**: Next.js 15 (App Router).
- **Estilos**: Vanilla CSS / SCSS Modules (no utilidades ad-hoc).
- **Testing**: Vitest + React Testing Library. Todo cambio debe incluir o actualizar sus respectivos tests.
- **Estética**: Mantener el sistema de diseño premium y animaciones sutiles.

---

> [!TIP]
> **Orden Recomendado**: Comienza con la limpieza de `app/layout.tsx` (Tarea 1) para establecer la nueva jerarquía de carga antes de modificar la lógica de seguimiento (Tarea 2) y validación (Tarea 3).
