# Pricing Model & Business Logic

**Purpose:** Definitive guide to calculation formulas, rounding rules, and business constraints.
**Source of Truth:** `lib/pricing.ts` (Logic) and `config/business.ts` (Data).

## 1. Volumetric Logic

Concrete is a physical product with strict delivery and billing constraints.

### 1.1 Rounding Policy (`M3_STEP`)

We do not sell exact fractional decimals (e.g., 2.3 m³).

- **Step:** 0.5 m³
- **Rule:** Always round **UP** to the nearest step.
  - *Input:* 4.1 m³ $\rightarrow$ *Billed:* 4.5 m³
  - *Input:* 4.6 m³ $\rightarrow$ *Billed:* 5.0 m³

### 1.2 Minimum Order Quantity (MOQ)

Sending a truck for small amounts is unprofitable.
We enforce a minimum billed volume per service type.

| Service Type | MOQ (m³) | Logic |
| :--- | :--- | :--- |
| **Directo** (Tiro Directo) | **2.0 m³** | If user requests 1 m³, we bill 2 m³. |
| **Bomba** (Pump Service) | **3.0 m³** | If user requests 1 m³, we bill 3 m³. |

**Precedence:** The MOQ check happens *after* the rounding step.

### 1.3 Volume Limits (Safety Constraints)

To prevent logistical errors or abuse of the calculator:

- **Minimum Calculation:** 0 m³ (Negative values are normalized to 0).
- **Maximum Single Order:** **50 m³** (Soft limit).
  - *Note:* Projects exceeding this volume typically require special logistics/pricing and should be directed to "Asesoría Técnica".

## 2. Pricing Architecture

The final price is composed of three layers:

$$
\text{Total} = (\text{Base Price} \times \text{Volume}) + \text{Additives} + \text{VAT}
$$

### 2.1 Base Price Matrix

Prices are determined by the intersection of **Concrete Type** (Direct vs Pumped) and **Strength** ($f'c$).

- **Volume Tiers:** The system supports dynamic pricing based on volume (e.g., bulk discounts).
- **Fallback Logic:** If the billed volume exceeds the maximum range defined in the configuration, the system automatically applies the price of the **last available tier** (typically the lowest unit price).

### 2.2 Additives Model

Additives are extra chemical or physical components. We support two pricing models:

1. **Volumetric (`per_m3`):**
    - Cost scales with the billed volume.
    - *Formula:* $\text{Price} \times \text{Billed } m^3$
    - *Example:* Fiber ($150/m³) x 5m³ = $750.
2. **Fixed Service (`fixed_per_load`):**
    - One-time fee per trip/service regardless of volume.
    - *Example:* Mileage surcharge for remote areas.

### 2.3 Taxes & Validity

- **VAT Rate:** 8% (Border Region Zone / IVA Fronterizo).
- **Calculation Order:**
    1. **Base Subtotal:** `round(Unit Price * Volume)`
    2. **Additives Subtotal:** `sum(round(Additive Price * Quantity))`
    3. **Subtotal:** `Base Subtotal + Additives Subtotal`
    4. **VAT:** `round(Subtotal * 0.08)`
    5. **Total:** `Subtotal + VAT`
- **Validity:** Quotes are technically valid for **7 days** (`QUOTE_VALIDITY_DAYS`), though prices are subject to change without notice.

## 3. Geometric Calculators

Helpers to assist users who don't know their volume.

### 3.1 Solid Slab (Losa Sólida)

Calculated as geometric volume with a specific adjustment factor.

$$
V = \text{Area} \times \text{Thickness} \times 0.98
$$

- **Adjustment Factor (0.98):** Reduces the theoretical volume by 2%, accounting for volume displacement (e.g., rebar/bovedilla) or specific local estimation practices.

### 3.2 Coffered Slab (Losa Aligerada / Casetón)

Uses a "Contribution Coefficient" (Coeficiente de Aporte) based on the styrofoam block size (`cofferedSize`).

| Casetón Size | Total Slab Thickness | Coefficient |
| :--- | :--- | :--- |
| **7 cm** | 12 cm | 0.085 ($m^3/m^2$) |
| **10 cm** | 15 cm | 0.108 ($m^3/m^2$) |
| **15 cm** | 20 cm | 0.135 ($m^3/m^2$) |

- *Formula:* $V = \text{Area} \times \text{Coefficient}$

### 3.3 Elements (Footings/Walls)

Pure geometric calculation without waste factors applied automatically.

- *Formula:* $V = L \times W \times H$

## 4. Integrity & History (Snapshot Pattern)

To ensure operational reliability in a real-world business environment, we implement a **Snapshot Pattern** for all quotes and orders.

### 4.1 Price Immutability

When an item is added to the cart or an order is created, the system captures a `pricingSnapshot` that includes:

- **`rules_version`**: The internal version of the `PricingRules`.
- **`timestamp`**: Exact moment of calculation.
- **`rules_applied`**: A full copy of the prices used.

### 4.2 Handling Price Changes

If the business updates prices in `config/business.ts` (e.g., from $v1$ to $v2$):

- **New Calculations**: Use $v2$.
- **Existing Cart Items**: Retain $v1$ prices. The user will see a warning message: *"Base prices have changed since this quote was created."*. We need to define a policy for this.
- **Edits to Old Items**: The system detects the version mismatch and warns the staff/user: *"Base prices have changed since this quote was created."*. We need to define a policy for this.
- **Persisted Orders**: Always use their original snapshot for reporting and balance calculation.
