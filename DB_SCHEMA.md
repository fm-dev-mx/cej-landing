# Database Schema

The database utilizes PostgreSQL (via Supabase) and is architected to support the transition from anonymous leads to registered SaaS users without data loss.

## 1. Entity-Relationship Diagram (Simplified)

```mermaid
erDiagram
    LEADS {
        uuid id PK
        jsonb quote_data "Calculator Snapshot"
        string contact_info
        timestamp created_at
    }
    PROFILES {
        uuid id PK "FK auth.users"
        string rfc
        string address
        string role "client | admin"
    }
    ORDERS {
        uuid id PK
        uuid user_id FK "-> profiles.id"
        jsonb items "Line Items Array"
        float total_amount
        string status "draft | confirmed | paid"
    }
    PRICE_CONFIG {
        string id PK
        jsonb pricing_rules "Base + Tiers"
        timestamp updated_at
    }

    PROFILES ||--o{ ORDERS : places
```

## 2. Table Definitions

### `public.leads` (Active)

Primary inbox for anonymous activity.

- **Purpose:** Audit trail and backup for web conversions.
- **Key Column:** `quote_data` (JSONB). Stores the *exact* calculator snapshot (inputs, formulas used, prices at that moment) to prevent future discrepancies if prices change.
- **Security:** Write-only via Server Action (Service Role). No public read access.

**JSONB Structure (`quote_data`):**

```tsx
{
  folio: string;
  customer: { name: string; phone: string; };
  items: Array<{
    id: string;
    label: string;
    volume: number;
    service: "direct" | "pumped";
    subtotal: number;
  }>;
  financials: { total: number; currency: "MXN"; };
  metadata: { source: string; userAgent: string; };
}
```

### `public.profiles` (Provisioned)

Extension of the Auth table.

- **Trigger:** `handle_new_user` automatically creates this row upon user registration.
- **Data:** Fiscal and billing information.

### `public.orders` (Provisioned - SaaS Core)

Structured history for registered users.

- **Difference from Leads:** Data is normalized and linked to a User ID. Allows status mutations (Ordered -> Paid -> Delivered).
- **Security (RLS):**
    - `SELECT`: Strictly limited to the record owner (`auth.uid() = user_id`).
    - `INSERT`: Authenticated users only.

### `public.price_config` (Provisioned)

Source of truth for pricing.

- **Future Usage:** The frontend will read from this table (using ISR) instead of the static `business.ts` file, allowing dynamic price updates via the Admin Panel without redeploying code.

## 3. Security & RLS Policies

- **Anon Key:** Only permits public read access on `price_config` (Future).
- **Service Role:** Used exclusively in Server Actions to write to `leads`, bypassing public RLS restrictions to prevent spam.
- **Auth User:** Will have CRUD permissions limited strictly to their own records in `orders` and `profiles`.
