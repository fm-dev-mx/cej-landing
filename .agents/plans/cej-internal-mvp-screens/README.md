# CEJ Internal MVP Screens Plan

## Context
This plan documents the implementation strategy for CEJ Internal MVP operational screens in the existing Next.js App Router codebase.

The objective is to close the gap between current internal functionality and a shippable MVP internal operations surface, without entering ERP scope.

## Scope
This plan covers:
- Login and access control with role-aware permissions
- Dashboard with operational and financial KPI summary
- Internal order capture (core screen)
- Orders calendar (day/week slots)
- Orders list with filters and status updates
- Expenses capture (basic)
- Payroll capture (basic)
- Basic reports with export (CSV-first)
- Phase 2 optional growth: order origin and marketing attribution

This plan explicitly excludes:
- Full ERP accounting and invoicing workflows
- Procurement and inventory management
- Advanced payroll legal/tax engines
- CRM-grade automation and omnichannel orchestration
- Heavy new UI/data libraries that diverge from current stack patterns

## How To Use These Documents
Read in this order:
1. `00-audit.md` to understand repository truth and risk areas.
2. `01-refactor-start.md` to prepare branch/commit/checkpoint strategy.
3. `02-phase-1-mvp.md` to execute the shippable MVP slice.
4. `03-phase-2-growth.md` to layer growth and attribution features.
5. `04-refactor-finish.md` to close cleanup, QA, and release readiness.
6. `CHANGELOG.md` to track planned and then completed work.

## Constraints And Assumptions
- Context7 MCP is not available in this session (`list_resources` returned no `Context7` server/resources).
- Business-rule validation is therefore inferred from repository evidence only.
- Any implementation that touches architecture-sensitive business contracts must be revalidated against Context7 if it becomes available.
