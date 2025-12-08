# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - Phase 3: Marketing Ops
### Planned
- **Server-Side Tracking:** Meta Conversions API (CAPI) integration to bypass iOS restrictions.
- **Event Architecture:** Deduplication logic using shared `event_id` between Pixel and Server.
- **Semantic SEO:** Implementation of `OfferCatalog` and `Product` schemas for rich snippets.

## [0.2.0] - 2025-12-08 (Phase 2: Expert Engine)
**Focus:** Dynamic pricing architecture, additives support, and advanced UI/UX.

### Added
- **Expert Mode UI:** Toggleable interface (`ExpertToggle`) allowing advanced users to select additives like Fiber or Accelerants.
- **Dynamic Pricing Core:** Refactored `calcQuote` to accept injected `PricingRules`, decoupling logic from static data.
- **Additives Logic:** Support for volumetric (`per_m3`) and fixed (`fixed_per_load`) pricing models.
- **Data Contract:** Implemented `lib/schemas/pricing.ts` with Zod to strictly validate local and remote pricing configurations.
- **Detailed Summary:** The calculator now displays a breakdown of costs (Base Concrete + Additives + VAT) instead of a single total.
- **Desktop UX:** Added a "My Orders" button to the header for easier access to history on large screens.

### Changed
- **State Management:** Upgraded `useCejStore` to version 2, adding auto-migration to safely initialize new state fields (`additives`, `showExpertOptions`) for existing users.
- **Data Persistence:** Updated `useCheckout` payload to include the `additives` array in the `quote_data` JSONB stored in Supabase.
- **Resilience:** Implemented `DEFAULT_PRICING_RULES` as a fail-open fallback mechanism.

### Fixed
- **Visual Regression:** Fixed label mismatch ("Total Estimado" vs "Total Neto") in integration tests.
- **Hydration Stability:** Resolved potential crashes when accessing undefined properties in legacy local storage states.

## [0.1.0] - 2025-12-07 (Phase 1: Data Core)
**Focus:** Infrastructure hardening and fail-open persistence.

### Added
- **Fail-Open Architecture:** Resilient `submitLead` Server Action that degrades gracefully (logging warnings) if the DB is unreachable.
- **Database Schema:** Configuration for `leads` table with JSONB `quote_data` and RLS policies.
- **Monitoring:** Non-blocking error reporting utility (`lib/monitoring.ts`).
- **Type Safety:** Strict Zod schemas for order submission and environment variables.
- **Testing:** Comprehensive unit tests for mathematical integrity in `pricing.ts`.
