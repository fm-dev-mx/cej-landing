# Phase 2 – Growth Plan (Blueprint)

This phase shifts the focus from "Operational Basics" to "Scalable Growth" and "Risk Mitigation". The strategy is based on 4 pillars selected for their systemic impact and architectural alignment.

## Strategic Pillars

1. **Data Attribution Layer (ROI)**: Technical normalization of UTMs to understand channel performance.
2. **Customer Intelligence (CRM)**: Historical views and retention strategy.
3. **Operational Safeguards (Alerts)**: Preventive motor to reduce financial and logistical errors.
4. **Professional Financial Reporting**: High-fidelity XLSX exports for accounting and auditing.

## Implementation Roadmap (Sequence)

1. **[01 - Data Attribution](01-attribution-layer.md)**: Foundation for understanding where growth comes from.
2. **[02 - Customer Intelligence](02-customer-intelligence.md)**: Tools to retain and grow current customer LTV.
3. **[03 - Operational Safeguards](03-operational-safeguards.md)**: Protecting margins by reducing errors.
4. **[04 - Professional Reporting](04-financial-reporting.md)**: Final layer of financial accountability and scaling.

## Architectural Philosophy
- **Supabase-Centric**: Use Edge Functions or DB Triggers for attribution if necessary.
- **Next.js Server Actions**: Maintain internal audit logs for all guardrail alerts.
- **Fail-Safe Exports**: Decouple reporting logic from UI to allow heavy processing.
