# Playbook 04: SaaS Portal (Auth & History)

**Status:** Planned
**Goal:** Transition from anonymous guest checkout to authenticated user accounts with order history.

## 1. Scope & Objectives

We are introducing the "Client Portal" capabilities.

- **Authentication:** Allow users to Sign Up / Login via Email (Magic Link) or OTP (Future).
- **Identity:** Create a permanent `Profile` record linked to the Auth User.
- **History:** Enable users to view their past Quotes and Orders.

## 2. Data Architecture

### 2.1 New Tables (Provisioned in `schema.sql`)

1. **`auth.users` (Supabase Internal):** Handles credentials and sessions.
2. **`public.profiles`:**
    - `id`: References `auth.users(id)`.
    - `full_name`, `email`, `phone`, `rfc`, `address`.
    - *Security:* RLS enabled (Users can only read/edit their own profile).
3. **`public.orders`:**
    - Evolution of the `leads` table for registered users.
    - Linked to `profiles.id`.

### 2.2 The "Trigger" Pattern

We must ensure every registered user has a corresponding row in `public.profiles`.

- **Mechanism:** Postgres Trigger `on_auth_user_created`.
- **Action:** Automatically inserts into `public.profiles` using data from `raw_user_meta_data`.

## 3. Execution Steps

### Step 1: Authentication Infrastructure

- [ ] Install Supabase SSR helpers: `@supabase/ssr`.
- [ ] Create Auth Hooks: `useUser`, `useSession`.
- [ ] Create Middleware: Protect routes under `/app/(app)/dashboard`.

### Step 2: Auth UI Components

- [ ] **Login Screen:** Simple form requesting Email.
- [ ] **OTP/Magic Link Handler:** Verify token logic.
- [ ] **User Menu:** Update Header to show "Hola, [Name]" when logged in.

### Step 3: Order History

- [ ] **Sync Logic:** When a user logs in, check if they have local `cart` items or previous `leads` (via cookie matching) and associate them (Optional MVP).
- [ ] **Dashboard Page:** List rows from `public.orders`.
- [ ] **Detail View:** Re-use `TicketDisplay` to show order details.

## 4. Exit Criteria

1. User can Sign Up via Magic Link.
2. User is redirected to `/dashboard` upon login.
3. `public.profiles` is populated automatically.
4. User can logout.
5. **Quality Gate:** All Auth and Dashboard integration tests pass 100%.
