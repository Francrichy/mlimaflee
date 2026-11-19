# MlimaniFleet Accounting Backend — Integration Guide

This release adds tenant-scoped accounting data models and REST API endpoints to the existing Express + Prisma + PostgreSQL API. It is a backend foundation and needs an integration test run against a real PostgreSQL database before production use.

## Modules

- Customers and suppliers
- Customer invoices, draft submission, approvals, receipts and outstanding balances
- Supplier bills, approvals, supplier payments and payable balances
- Accounts receivable/payable ageing
- Bank, cash and mobile-money accounts, transactions and reconciliation flags
- Driver wages, salaries, advances and allowances (recorded by payment category)
- Tyre inventory/lifecycle and vehicle linkage
- Vehicle/other asset register and straight-line management depreciation estimate
- Budgets and actual spend comparison
- Trip revenue, fuel cost and other cost fields, vehicle/trip profitability
- Customer/contract profitability reports
- Fleet P&L, cash-flow summary, tax-oriented invoice CSV export
- Approval records and audit log events

## API base

All routes require `Authorization: Bearer <JWT>` unless noted otherwise. All `/api/accounting/*` reads and writes are scoped to the organization in the authenticated token. Foreign-key IDs are checked against the same organization when creating generic accounting records.

### Generic resources

`GET /api/accounting/{resource}` and `POST /api/accounting/{resource}`

Supported resources: `customers`, `suppliers`, `invoices`, `receipts`, `supplier-bills`, `supplier-payments`, `bank-accounts`, `bank-transactions`, `driver-payments`, `tyres`, `assets`, `budgets`, `contracts`, `journal-entries`, `approvals`.

The POST endpoint is a basic record-creation endpoint, not a replacement for the specialized payment/approval workflows. Use the specialized endpoints below for customer receipts and supplier payments.

### Invoice and payment workflows

- `POST /api/accounting/invoices/:id/submit` — submit a draft invoice for approval.
- `POST /api/accounting/invoices/:id/receipts` — record a receipt; requires an approved/part-paid invoice and rejects overpayment.
- `POST /api/accounting/supplier-bills/:id/submit` — submit a draft supplier bill.
- `POST /api/accounting/supplier-bills/:id/payments` — record a supplier payment; requires an approved/part-paid bill and rejects overpayment.
- `POST /api/accounting/approvals/:id/decision` — approve/reject as ORG_ADMIN only (and not by the person who submitted the document).
- `POST /api/accounting/bank-transactions/:id/reconcile` — mark a bank transaction reconciled.
- `GET /api/accounting/finance-overview` — consolidated cash, working capital, debt, spend, asset and control dashboard. Finance data/report reads are restricted to company administrators and accountants.
- New journal-entry drafts require balanced debit and credit lines (`accountCode`, `debit`, `credit`); posting to the general ledger is not implemented yet.

### Reports

- `GET /api/accounting/reports/profit-loss?from=ISO_DATE&to=ISO_DATE`
- `GET /api/accounting/reports/receivables-ageing`
- `GET /api/accounting/reports/payables-ageing`
- `GET /api/accounting/reports/cash-flow?from=ISO_DATE&to=ISO_DATE`
- `GET /api/accounting/reports/trip-profitability`
- `GET /api/accounting/reports/customer-contract-profitability`
- `GET /api/accounting/reports/budget-vs-actual`
- `GET /api/accounting/reports/asset-register?asOf=ISO_DATE`
- `GET /api/accounting/reports/tax-export.csv?from=ISO_DATE&to=ISO_DATE`

## Deployment on Render

1. Push the repository root (the folder containing `render.yaml`) to a private GitHub repository.
2. In Render, create a Blueprint from that repository and review database/service costs.
3. Set `WEB_ORIGIN` on the API and `VITE_API_URL` on the web service after service URLs are known.
4. Set `SUPER_ADMIN_EMAIL`, a unique strong `SUPER_ADMIN_PASSWORD` (14+ characters), and `SUPER_ADMIN_NAME` as Render environment variables. Do not put secrets in Git.
5. Confirm the Render pre-deploy step `npx prisma db push` succeeds against the attached PostgreSQL database. This project currently uses Prisma db push; adopt checked-in migrations before production changes.
6. Run the one-time super-admin provisioning command from the API shell: `npm run admin:create`.
7. Run `npm run db:seed` if plans have not been seeded. Confirm `/api/health` returns `{"ok":true,...}`.
8. Test organization registration, tenant isolation, invoices, approvals, partial receipts, bills, partial supplier payments, ageing reports and CSV export with test data.

## Accounting and production caveats

- Monetary fields use decimal database types. Financial reports return JSON numbers for display; never use JavaScript floating-point values as the authoritative accounting ledger.
- This release does not yet post every operation into a balanced double-entry general ledger. `JournalEntry` stores draft journal metadata/lines but posting, debit-credit balancing, period locks and full ledger statements remain follow-up work.
- Tax export is an invoice data export, not a certified TRA/EFD integration or tax filing. Configure applicable Tanzanian VAT/tax rules with a qualified accountant.
- Management depreciation is a straight-line estimate, not a tax depreciation schedule.
- Cash-flow report summarizes recorded customer receipts and supplier payments; direct bank feed/mobile-money provider reconciliation is not integrated. Transactions must be imported/entered before reconciling.
- Avoid recording the same cost in both `Expense`, `Maintenance`, `SupplierBill`, and/or `Trip.otherCosts`; doing so may double-count costs in the management P&L. A future posting ledger should enforce a single source of truth.
- Generic create endpoints need field-level validation and permission policies before production. Add edit/void workflows, immutable posted journals, idempotency keys, pagination, rate limits, backups, restore drills, integration tests and security review before accepting live financial records.
- Payment-provider APIs for the MlimaniFleet SaaS subscription are separate from customer invoice receipts in this accounting module. Do not treat an unverified provider callback as proof of payment.

## Credit, loan and due-reminder extension

The accounting API now includes:

- `GET /api/accounting/loans` — loan register and instalment schedules.
- `POST /api/accounting/loans` — create a loan with optional scheduled instalments.
- `POST /api/accounting/loans/:loanId/installments/:id/payment` — record a partial or full instalment payment; overpayments are rejected.
- `GET /api/accounting/reminders?days=90` — unified customer receivables, supplier payables, loan instalments, ageing buckets and payment/reminder history.
- Scheduled reminder checks run on API startup and every six hours. Duplicate attempts for a recipient/obligation/channel are suppressed for the same calendar day.

### Notification configuration

Configure these environment variables on the API service in Render:

- `RESEND_API_KEY` and `REMINDER_FROM_EMAIL` for internal staff email reminders.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` for SMS.
- Keep `ENABLE_EXTERNAL_DUE_REMINDERS=false` until the company has confirmed consent and the customer/supplier contact data is verified. Set it to `true` only if external SMS reminders are approved.

Email delivery uses the Resend API; SMS uses Twilio's API. Without valid credentials, reminders are logged as failed rather than reported as delivered. Review `ReminderDeliveryLog` / the Reminders UI delivery history.

### Database verification

After installing dependencies and running `npx prisma generate`, apply the schema to a dedicated test PostgreSQL database and run:

```bash
npx prisma validate
npx prisma db push
npm run db:verify-accounting
npm run build
```

`db:verify-accounting` uses a transaction and rolls back the temporary organization, loan, instalment and reminder rows. Run this against a test database, not a live production database. It was added as a repeatable check; it has not been run in this environment because dependency installation timed out and no PostgreSQL connection credentials were supplied.

### Production caveats

- Configure provider credentials and verify successful delivery before enabling reminders for real recipients.
- This is not a complete double-entry accounting ledger; review posting rules, tax treatment, financial statements, backups and restore procedures with a qualified accountant before statutory use.
- Render deployment and live PostgreSQL API checks require access to the actual Render service/database; no live service was modified from this workspace.
