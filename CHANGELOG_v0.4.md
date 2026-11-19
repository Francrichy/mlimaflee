# MlimaniFleet v0.4 — RBAC and Platform Owner Console

- Added tenant-scoped company user administration API and Users & Roles UI.
- Added protected create/update operations with password hashing, role allow-listing, organisation scoping, self-lockout protection and last-admin protection.
- Strengthened generic fleet write permission to `ORG_ADMIN`, `FLEET_MANAGER`, and `SUPER_ADMIN` only; accounting writer remains a separate finance permission.
- Added role-specific navigation for Platform Owner, Company Admin/Fleet Manager, Accountant, Driver and Viewer.
- Added separate Platform Owner Control Centre with live counts and tenant status management.
- Added audit events for company-user changes and platform organisation status changes.
- Added RBAC/security documentation and production-hardening checklist.

## Verification

TypeScript/TSX transpile syntax checks pass for the changed API and UI modules. Full dependency install, Prisma client generation/schema validation, production build, database integration tests and Render deployment have not been run in this environment.

## v0.5 — Financial management control centre

- Added a consolidated Financial Management dashboard for cash, receivables, payables, debt, month-to-date spend, asset register, approvals and reconciliation exceptions.
- Added tenant-scoped `/api/accounting/finance-overview` endpoint and restricted finance overview, resource reads and reports to company admins/accountants.
- Expanded cash-flow reporting into operational inflow/outflow categories and reconciliation counts.
- Enforced administrator-only financial approvals and prohibited self-approval.
- Added audit records for permitted accounting deletes and bank reconciliation actions.
- Added `FINANCIAL_MANAGEMENT_v0.5.md` documenting current finance coverage and limitations.
- Validation is syntax-level only; full dependency install/build and PostgreSQL tests remain outstanding.
