# 02 - Customer Intelligence (CRM Basics)

## Objective
Build a strategic view of the customer to improve retention, lifetime value (LTV), and credit management.

## Proposed Changes

### 1. Customer Detail View (`/dashboard/customers/[id]`)
- Historical list of all orders.
- Aggregated stats: Total volume (m³), Total spent, Average order value.
- Payment behavior: Ratio of `paid` vs `pending_payment` orders.

### 2. Retention Indicators
- "Last Active" date calculation.
- "Churn risk" flag if a customer hasn't ordered in X days (based on their historical frequency).

### 3. Internal Customer Notes
- Generic field for operational preferences (e.g., "Access issues with large trucks", "Requires prepayment").

## Verification Plan
- Verify that clicking a customer name in the order list navigates to their profile.
- Confirm stats are calculated correctly across all historical orders.
