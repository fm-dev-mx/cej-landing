# 04 - Professional Financial Reporting (XLSX Pro)

## Objective
Provide high-fidelity, multi-dimensional exports for accounting and auditing, moving beyond simple CSVs.

## Proposed Changes

### 1. XLSX Adapter
- Integrate a library for XLSX generation (e.g., `exceljs`).
- Structured tabs:
    - **Summary**: Balance, Net Margin, KPIs.
    - **Sales**: Detailed orders with volume and customer data.
    - **Expenses**: Categorized operational costs.
    - **Payroll**: Team compensation records.

### 2. Financial Formulas
- Embedded sums and balance calculations within the Excel file for offline auditing.

### 3. Date Range & Granularity
- Support for "Monthly Closures" and "Quarterly Reports" as pre-defined filters.

## Verification Plan
- Download report and verify that Excel formulas match the UI values.
- Confirm all tabs are populated correctly with the selected date range data.
