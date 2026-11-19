# MlimaniFleet v0.2 implementation status

## Implemented in this release candidate

1. **Vehicles and drivers:** tenant-scoped live registers, create/edit/delete controls, validation, expiry dates and driver lookup. Vehicle deletion is blocked when linked operational history exists.
2. **Trips and dispatch:** trip creation/editing, customer/contract links, dispatch transition, delivery confirmation and final distance/revenue/cost capture.
3. **Fuel:** dedicated fuel ledger with litres, unit price, calculated total, odometer, vehicle/driver/trip links, update/delete and efficiency reporting.
4. **Maintenance and tyres:** maintenance scheduling/completion records; tyre stock, installation/removal lifecycle and odometer checks.
5. **GPS:** existing hardware/phone GPS screens and APIs, plus a server-side Traccar poller every 60 seconds and configurable history retention.
6. **Finance:** operating expenses, customers, suppliers, invoices, receipts, supplier bills/payments, bank accounts/transactions/reconciliation, driver payments, loans/instalments, budgets, assets, contracts, journal entries and approvals.
7. **Profitability:** trip cost analysis including linked expenses/fuel, per-vehicle P&L, customer/contract profitability, fuel efficiency, cash flow, ageing, budgets, asset register and tax CSV export.
8. **Notifications/compliance:** document register, vehicle/driver expiry and maintenance due list, scheduled email reminders and delivery logs. SMS remains opt-in.
9. **Controls and reporting:** tenant scoping, role checks, audit entries for core resource/accounting mutations, live dashboard KPIs/activity and acceptance-test plan.

## Validation completed

- TypeScript/TSX transpilation syntax checks passed for API and frontend source files.
- Full `npm install` timed out in this execution environment. Dependencies are not present locally.
- Full TypeScript type-check/build, Prisma schema validation/client generation, PostgreSQL integration tests, browser E2E tests and Render deployment have not been completed.
- No production database or Render account was accessed or modified.

## Required before production

1. Back up PostgreSQL.
2. Deploy the API and allow Prisma Client generation and schema update to run.
3. Run `OPERATIONAL_ACCEPTANCE_TESTS.md` in staging.
4. Configure Resend and Traccar credentials if those services are required.
5. Configure and independently verify payment-provider signatures and settlement callbacks before enabling live payments.
6. Configure a production document storage provider before accepting direct file uploads.
