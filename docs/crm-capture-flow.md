# CRM Capture Flow & Business Rules

This document outlines the technical flow and business logic rules enforced across the CEJ CRM modules: Leads, Customers, and Orders.

## 1. Flow Overview
The capture model strictly follows this progression:
**`Lead` (Inquiry) ➔ `Customer` (Registration) ➔ `Order` (Transaction)**

1. **Lead Generation**: All web inquiries, phone calls, or social media contacts are initially registered in the `leads` table. A lead represents an unverified prospect.
2. **Customer Qualification**: Once a Lead's intent is confirmed and minimum identity requirements are satisfied, they are converted into a `Customer`.
3. **Order Creation**: Transactions can only be tied to a verified `Customer`.

---

## 2. Business Rules & Enforcement

### 2.1 Customer Identity & Uniqueness
- **Rule**: Customers must have a unique, normalized phone number (`primary_phone_norm`).
- **Enforcement Layer**: Checked dynamically at the Server Action level (`createAdminOrder.ts`). Before inserting a new customer, the system queries for an existing `primary_phone_norm` where `merged_into_customer_id IS NULL`. If found, the existing customer ID is reused to prevent duplicates. Identity verification is additionally tracked via the `customer_identities` table.

### 2.2 Order Mandates
- **Rule**: Orders must have a valid delivery address or specified pick-up details.
- **Rule**: Orders must contain pricing snapshots and financial summaries strictly tied to the canonical `quantity_m3` and `unit_price_before_vat`.
- **Enforcement Layer**: Executed via the `adminOrderPayloadSchema` (Zod Validation) and Server Action calculations (`calcQuote`).

### 2.3 Data Integrity (Soft Deletes)
- **Rule**: CRM records (Leads, Customers, Orders, Users) are never permanently removed from the database to retain audit trails and financial integrity.
- **Mechanism**: A `deleted_at` timestamp column exists on all primary entities (`leads`, `customers`, `orders`, `profiles`).
- **Enforcement Layer**:
    - At the Application Level: List queries and dashboard views must include a `.is('deleted_at', null)` filter.
    - At the Action Level: Deletions route through `softDeleteEntity.ts`, which enforces an `admin:all` permission check and processes an `UPDATE` rather than a `DELETE`.

---

## 3. Developer Access & Data Seeding
To support active development and QA cycles without compromising the production tracking:
- **RBAC**: A strict `developer` user role grants full `admin:all` bypasses, identical to the `owner` role, to facilitate deep debugging and QA.
- **Seeding & Idempotency**: Development seeds are marked with `utm_source = 'test_seed'` to clearly distinguish them from organic data and allow idempotent cleanup scripts (`scripts/seed-crm-data.ts`) to wipe them out without affecting real leads.
