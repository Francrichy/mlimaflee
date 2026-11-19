# MlimaniFleet Financial Management — v0.5

## Finance control centre added

The authenticated `Financial Management` page consumes `GET /api/accounting/finance-overview` and shows:

- Cash and bank account book balances, account currency and unreconciled transaction counts.
- Accounts receivable and accounts payable, including overdue amounts.
- Outstanding loan instalments and those due within 30 days.
- Month-to-date operational spend split into fuel, maintenance, driver payments and other expenses.
- Asset register cost and estimated accumulated straight-line depreciation.
- Pending approval and unreconciled bank transaction control queues.
- One-click mark-as-reconciled action for an already matched bank transaction.

The finance overview is available only to `ORG_ADMIN` and `ACCOUNTANT`. Financial resource reads and management reports are restricted to those roles. Existing tenant filters remain in place.

## Finance workflow controls strengthened

- Invoice and supplier-bill approvals now require a company administrator.
- A user cannot approve their own submitted invoice or supplier bill.
- New journal drafts require at least two account-coded lines and debit/credit totals balanced to the cent; generic edits and deletes of journal entries are blocked. This is not yet a posting ledger or a chart-of-accounts system.
- Bank reconciliation actions are written to the audit log with account, amount and reference metadata.
- Deleting a permitted draft/financial support record creates an audit log entry.
- Cash balances and receivable/payable/debt summaries avoid adding unlike currencies together; TZS totals are shown in the dashboard, and the API also returns currency groupings for receivables, payables and debt.
- Cash-flow reporting now separates recorded customer receipts, loan proceeds, supplier payments, general expenses, fuel, maintenance, driver payments and debt service. Bank transactions are counted for reconciliation status only, to avoid automatically double-counting mirrored cash entries.

## Financial management coverage checklist

| Area | Existing foundation | Status / limitation |
|---|---|---|
| Customer invoices and receipts | Invoice, receipt and approval workflows | Basic workflows present; no EFD/e-invoicing integration |
| Supplier bills and payments | Bill, payment and approval workflows | Basic workflows present |
| Receivables/payables ageing | Ageing reports and reminders | Present; currency-aware reporting should be completed before multi-currency statutory use |
| Cash, bank and mobile money | Accounts and manually entered transactions | Book balance only; no direct bank/mobile-money feed |
| Bank reconciliation | Reconciled flag and action | Manual matching only; no statement upload/import or bank feed matching yet |
| Driver payroll/advances | Driver payment records | Payment register only; payroll calculation, payslips and statutory deductions not implemented |
| Budgets | Budget records and budget-vs-actual report | Basic category comparison; actuals currently sourced from general expenses only |
| Assets/depreciation | Asset register and straight-line estimate | Management estimate only; disposals and statutory/tax schedules need stronger workflows |
| Loans | Loan register, instalment schedule and payment capture | Basic schedule; no lender statement import or interest accrual engine |
| Vehicle/trip/customer profitability | Operational reports | Management estimates; avoid duplicated costs in multiple source modules |
| Journal/general ledger | Draft journal metadata with JSON lines | Not a complete double-entry ledger; no chart of accounts, posting engine, trial balance or period lock |
| Tax | Invoice tax fields and CSV export | Not TRA filing, EFD, VAT return, withholding tax or payroll tax integration |
| Audit and approvals | Audit log and approval records | Basic controls; requires end-to-end security and concurrency testing |

## Important before live financial use

This application is not yet a certified accounting package or statutory accounting system. The most important remaining finance build is a full double-entry general ledger with chart of accounts, balanced debit/credit validation, posting rules from source documents, reversals/credit notes, fiscal periods and period locks, trial balance, balance sheet, cash-flow statement, general ledger and audit-grade journal immutability. Payroll needs Tanzania-specific PAYE, NSSF, WCF, SDL and other applicable deductions validated by a local payroll professional. Tax rules and EFD/TRA integrations require qualified Tanzanian accounting/tax review.

Do not rely on current P&L/cash-flow figures as statutory accounts until the duplicate-cost problem is resolved through a single posting source of truth. Supplier bills, general expenses, fuel, maintenance and trip costs can represent the same underlying cost.

## Validation performed in this workspace

- TypeScript/TSX syntax transpilation passed for API entry point and key web screens.
- Full `npm install` did not complete within the available execution window.
- Therefore Prisma client generation, Prisma schema validation, full TypeScript checks, Vite production build, PostgreSQL integration tests and browser acceptance tests remain unverified.
- No Render service, GitHub repository or production database was accessed or changed.
