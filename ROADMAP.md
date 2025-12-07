# Product Roadmap & Sprints

## 1. Strategic Phases

1. **CEJ Landing (Current):** Traffic capture and low-friction conversion to WhatsApp.
2. **CEJ Cotizador:** Robust tool with multi-item cart, history, and persistence.
3. **CEJ Pro (SaaS):** Contractor platform for order management, billing, and reordering.

## 2. Functionality by Role (Target Vision)

| Feature | Visitor (Anonymous) | Pro User (Registered) | Admin (CEJ) |
| --- | --- | --- | --- |
| **Calculator** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Pre-Quote** | ✅ (WhatsApp) | ✅ (PDF Ticket) | - |
| **History** | ⚠️ Local (Session) | ✅ Cloud (Persistent) | ✅ Global View |
| **Orders** | ❌ | ✅ Formal Creation | ✅ Status Management |
| **Billing** | ❌ | ✅ Request Invoice | ✅ Validation |
| **Dashboard** | ❌ | ✅ Spend Analytics | ✅ Sales Analytics |

## 3. Sprint Plan

### 🏃 Sprint 1: UX Consolidation & Core Fixes (Immediate)

*Goal: Ensure 100% Calculator reliability and unified UI feedback.*

- [ ]  **Critical UX Fix:** Move `QuoteDrawer` and `SmartBottomBar` to the Root Layout or inject them into the Marketing Layout.
- [ ]  **Feedback Loop:** Implement global Toasts when adding items to the cart from the landing page.
- [ ]  **Expert Mode:** Enable UI for additive selection (Fiber, Accelerant) utilizing the existing store logic.
- [ ]  **QA:** Expand Unit Test coverage for `pricing.ts` to cover edge cases (rounding errors, min-order quantities).

### 🏃 Sprint 2: Authentication & Profiles

*Goal: Identify recurring users.*

- [ ]  Implement Login/Register using Supabase Auth (Magic Link + Google).
- [ ]  Create Onboarding flows to capture Fiscal Data (RFC, Address) into `public.profiles`.
- [ ]  Protect `/app/*` routes via Middleware.

### 🏃 Sprint 3: Order Management & Tickets

*Goal: Professionalize the quote delivery.*

- [ ]  **Sync Engine:** Create a hook to migrate local `localStorage` cart items to the `orders` DB table upon login.
- [ ]  **Ticket Generator:** Implement an endpoint to generate downloadable PDF quotes (matching visual reference).
- [ ]  Build the "My Orders" (History) view.

### 🏃 Sprint 4: Dashboard & Sales (Mid-Term)

*Goal: Provide control tools.*

- [ ]  User Dashboard: Volume purchased charts.
- [ ]  Basic Admin Panel: Lead list and Order Status management.
- [ ]  **Marketing Ops:** Full implementation of Meta CAPI (Server-Side Events) for ad optimization.

### 🏃 Sprints 5 & 6: Billing & Tracking

*Goal: Operational automation.*

- [ ]  Invoice Request module linked to completed orders.
- [ ]  Order Tracking System (Status: At Plant, En Route, Delivered).
