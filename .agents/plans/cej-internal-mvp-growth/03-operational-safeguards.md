# 03 - Operational Safeguards (Alerts Motor)

## Objective
Proactively identify errors that cost money (unpaid orders) or reputation (late deliveries).

## Proposed Changes

### 1. Alert Types
- **Unpaid Risk**: Order state remains `pending_payment` within 24h of delivery date.
- **Logistics Guard**: `scheduled` orders for "Tomorrow" that lack specific dispatch notes or volume confirmation.
- **Credit Limit**: Customer exceeds historical credit thresholds (if applicable).

### 2. Visual Interaction (Dashboard)
- Dedicated "Action Needed" section on the main dashboard.
- Pulsing/Color-coded status badges for high-priority alerts in the global orders list.

### 3. Notification Backplane
- Basic logging of alert triggers.
- Potential integration with external hooks (WhatsApp/Email) in later stages.

## Verification Plan
- Create an order for tomorrow and verify it triggers a "Logistics Guard" alert.
- Mark an order as `pending_payment` and verify it appears in the "Unpaid Risk" list.
