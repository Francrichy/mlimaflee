# MlimaniFleet Profit & Loss module

The web UI now includes a dedicated **Profit & Loss** navigation item with:

- Fleet-wide monthly revenue, operating costs, operating profit, and margin KPIs.
- A fleet-level P&L statement and operating cost breakdown.
- Truck-by-truck revenue, trips, distance, fuel cost, other costs, total costs, operating profit, and margin.
- Additional finance indicators for receivables, payables, fuel cost per kilometre, and downtime.
- Print / Save as PDF action and a checklist of the accounting controls needed for a full financial module.

## Important implementation status

The figures shown in this first UI pass are illustrative demo data. The screen is not yet connected to live accounting records. Before commercial use, implement tenant-scoped API endpoints and database models for customer invoices/revenue, trip allocations, fuel and other expenses, driver wages, supplier bills, receivables/payables, cash receipts/payments, depreciation, tax/finance adjustments, budgets, approvals, and audit events. P&L totals must be computed on the server from posted records, with a consistent date range and clear cash/accrual basis; do not treat demo values as actual company accounts.

Truck-level costs should be allocated directly to a truck wherever possible. Shared costs (insurance, office/admin overhead, tracking subscriptions, etc.) need a configurable allocation method. Distance-based metrics should use verified odometer or GPS trip distance and identify missing readings. Keep draft, approved, and posted records distinct, and prevent users in one organization from querying another organization's finance data.
