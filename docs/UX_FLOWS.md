# UX Flow Maps

**Scope:** Critical user journeys and state transitions for the CEJ platform.
**Source of Truth:** Component implementations, hooks, and store logic.

---

## 1. Calculator Flow (Quote Creation)

### 1.1 High-Level Journey

```mermaid
graph LR
    A[Landing Page] --> B[Calculator Section]
    B --> C{Mode Selection}
    C -->|"Sé los m³"| D1[Direct Volume Input]
    C -->|"Ayúdame a calcular"| D2[Work Type Selection]
    D1 --> E[Specs Selection]
    D2 --> D3[Dimensions Input]
    D3 --> E
    E --> F{Expert Mode?}
    F -->|No| G[Summary/Ticket]
    F -->|Yes| H[Additives Selection]
    H --> G
    G --> I[Add to Cart]
    I --> J[Quote Drawer]
```

### 1.2 Mode Selection

| Mode | ID | Entry Point | Next Step |
|:-----|:---|:------------|:----------|
| **Sé los m³** | `knownM3` | User knows exact volume | Direct to volume input |
| **Ayúdame a calcular** | `assistM3` | User needs dimension help | Work type selector |

### 1.3 Assist Mode Sub-Flow

```mermaid
flowchart TD
    A[Work Type Selector] --> B{Type}
    B -->|Losa sólida| C1[Length + Width + Thickness]
    B -->|Losa aligerada| C2[Length + Width + Casetón Size]
    B -->|Zapata| C3[Length + Width + Depth]
    B -->|Muro| C4[Length + Height + Thickness]
    B -->|Firme| C5[Length + Width + Thickness]
    C1 --> D[Calculate Volume]
    C2 --> D
    C3 --> D
    C4 --> D
    C5 --> D
    D --> E[Apply 0.98 Factor if Slab]
    E --> F[Round to 0.5 m³]
```

### 1.4 State Machine: Calculator

```mermaid
stateDiagram-v2
    [*] --> NoMode
    NoMode --> KnownM3: selectMode(knownM3)
    NoMode --> AssistM3: selectMode(assistM3)

    KnownM3 --> SpecsReady: enterVolume

    AssistM3 --> WorkTypeSelected: selectWorkType
    WorkTypeSelected --> DimensionsEntered: enterDimensions
    DimensionsEntered --> SpecsReady: volume calculated

    SpecsReady --> SummaryReady: selectSpecs
    SummaryReady --> AddedToCart: addToCart()
```

---

## 2. Cart Management Flow

### 2.1 Cart Operations

```mermaid
flowchart LR
    subgraph Actions
        A1[Add Item] --> C[Cart State]
        A2[Remove Item] --> C
        A3[Edit Item] --> C
        A4[Clone Item] --> C
        A5[Clear Cart] --> C
    end

    C --> D[Persisted to localStorage]
```

### 2.2 Cart Item Lifecycle

| Action | Effect | Store Method |
|:-------|:-------|:-------------|
| **Add** | Create new CartItem from QuoteBreakdown | `addToCart(quote)` |
| **Remove** | Delete item by ID | `removeFromCart(id)` |
| **Edit** | Load item config back to draft | `editCartItem(id)` |
| **Clone** | Duplicate item with new ID | `cloneCartItem(item)` |
| **Clear** | Remove all items | `clearCart()` |
| **Checkout** | Move to history | `moveToHistory()` |

### 2.3 Quote Drawer States

```mermaid
stateDiagram-v2
    [*] --> Closed
    Closed --> Open: setDrawerOpen(true)
    Open --> Closed: setDrawerOpen(false)

    state Open {
        [*] --> OrderTab
        OrderTab --> HistoryTab: setActiveTab('history')
        HistoryTab --> OrderTab: setActiveTab('order')
    }
```

---

## 3. Checkout Flow

### 3.1 End-to-End Journey

```mermaid
sequenceDiagram
    participant User
    participant Drawer as QuoteDrawer
    participant Modal as LeadFormModal
    participant Hook as useCheckoutUI
    participant Server as submitLead
    participant WA as WhatsApp

    User->>Drawer: Click "Solicitar Cotización"
    Drawer->>Modal: Open LeadFormModal
    User->>Modal: Fill name + phone
    User->>Modal: Accept privacy
    User->>Modal: Click "Generar Ticket"
    Modal->>Hook: processOrder(customer, save)

    Hook->>Hook: Generate folio + event_id
    Hook->>Hook: Build OrderPayload
    Hook->>Hook: trackLead(Pixel)
    Hook->>Server: submitLead(payload)

    alt Success
        Server-->>Hook: { status: 'success' }
        Hook->>Hook: moveToHistory()
        Hook->>WA: Open prefilled chat
        WA-->>User: WhatsApp conversation
    else Fail
        Server-->>Hook: { status: 'error' }
        Hook-->>Modal: Show error message
    end
```

### 3.2 Lead Form Validation

| Field | Required | Validation |
|:------|:---------|:-----------|
| `name` | ✅ | Min 3 characters |
| `phone` | ✅ | Min 10 digits |
| `privacyAccepted` | ✅ | Must be checked |
| `saveMyData` | ❌ | Optional (default: true) |

### 3.3 Fail-Open Pattern

```
Normal Path:
  User → Form → Server → DB ✓ → CAPI ✓ → WhatsApp

Fail-Open Path:
  User → Form → Server → DB ✗ (logged) → WhatsApp ✓
                                ↓
                        (User never blocked)
```

---

## 4. WhatsApp Handoff

### 4.1 Message Generation

```
🧾 Cotización CEJ - Folio: [FOLIO]
━━━━━━━━━━━━━━━━

📦 [n] producto(s):

• [Label 1]
  └ [Volume] m³ · [Service] · $[Subtotal]

• [Label 2]
  └ [Volume] m³ · [Service] · $[Subtotal]

━━━━━━━━━━━━━━━━
💰 Total: $[TOTAL] MXN

👤 Cliente: [NAME]
```

### 4.2 Handoff URL

```
https://wa.me/[PHONE]?text=[ENCODED_MESSAGE]
```

---

## 5. Expert Mode Flow

### 5.1 Toggle Behavior

```mermaid
flowchart LR
    A[Básico Mode] -->|Toggle| B[+Aditivos Mode]
    B -->|Toggle| A

    subgraph Básico
        A1[Standard Specs Only]
    end

    subgraph Expert
        B1[Standard Specs]
        B2[Additives Selection]
    end
```

### 5.2 Additives Selection

| Additive | Pricing | Effect |
|:---------|:--------|:-------|
| **Fibra** | per_m³ ($150) | Volume × Price |
| **Plastimer** | per_m³ | Volume × Price |
| **Acelerante** | per_m³ | Volume × Price |

---

## 6. Error Recovery Flows

### 6.1 Validation Error Recovery

```mermaid
flowchart TD
    A[User Submits Form] --> B{Validation}
    B -->|Pass| C[Process Order]
    B -->|Fail| D[Show Inline Errors]
    D --> E[User Corrects Fields]
    E --> A
```

### 6.2 Server Error Recovery

```mermaid
flowchart TD
    A[Submit to Server] --> B{Server Response}
    B -->|Success| C[Continue to WhatsApp]
    B -->|Error| D[Show Error Banner]
    D --> E{User Action}
    E -->|Retry| A
    E -->|Cancel| F[Close Modal]
```

---

## 7. Mobile-Specific Flows

### 7.1 Bottom Bar Visibility

```mermaid
flowchart TD
    A{Device} -->|Mobile| B{Cart Status}
    A -->|Desktop| C[Bottom Bar Hidden]

    B -->|Empty| D[Bottom Bar Hidden]
    B -->|Has Items| E[Bottom Bar Visible]

    E --> F[Shows: Items Count + Total + CTA]
```

### 7.2 Modal → Sheet Transformation

| Breakpoint | Dialog Style |
|:-----------|:-------------|
| < 768px | Bottom sheet (swipe up) |
| ≥ 768px | Centered modal |

---

## 8. Analytics Events

### 8.1 Tracked Events

| Event | Trigger | Destination |
|:------|:--------|:------------|
| `Lead` | Checkout submit | Pixel + CAPI |
| `Contact` (WhatsApp) | WhatsApp opens | Pixel |
| `AddToCart` | Add to cart | (Future) |
| `ViewContent` | Calculator view | (Future) |

### 8.2 Deduplication Strategy

```
Client (Pixel)  ──────────────────────────────────┐
                                                  │
                    ┌── event_id (UUID) ──────────┤
                    │                             │
Server (CAPI)  ─────┘                             ▼
                                           Meta Servers
                                           (Deduplicated)
```
