# 01 - Data Attribution Layer (ROI Tracking)

## Objective
Implement a robust, automated system to link marketing traffic data (UTMs) to internal orders, enabling a clear view of ROI per channel.

## Proposed Changes

### 1. Database Schema Expansion
- Normalize `attribution_data` in the `orders` table (JSONB or dedicated columns).
- Capture: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`.
- Capture `fbclid` and `gclid` for advanced tracking (CAPI compatibility).

### 2. Logic & Tracking Sync
- Update `proxy.ts` to ensure attribution cookies are correctly passed to internal order creation actions.
- Modify `createAdminOrder` and `submitLead` to persist these fields consistently.
- Implement a "Source Resolver" utility to handle attribution logic (e.g., First Click vs Last Click models).

### 3. Analytics Hooks
- Create server-side hooks to aggregate sales by `utm_source`.
- Baseline report: "Sales Volume vs Marketing Source".

## Verification Plan
- Verify that clicking a link with `?utm_source=fb` results in an order with `utm_source: 'fb'`.
- Ensure no data loss when transitioning from public `lead` to internal `order`.
