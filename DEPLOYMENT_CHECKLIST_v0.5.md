# MlimaniFleet v0.5 — Render deployment checklist

## 1. Before creating the Render Blueprint

- Push the contents of this project folder (the folder containing `render.yaml`) to a private GitHub repository.
- Confirm no `.env` file, database password, JWT secret, payment token or SMTP/API secret is committed.
- Use a production PostgreSQL database and confirm its backup/restore policy.
- Review the Render database/service plans and expected monthly cost before provisioning.

## 2. Render Blueprint services

The blueprint defines:

- `mlimanifleet-db` — PostgreSQL database.
- `mlimanifleet-api` — Express/Prisma API.
- `mlimanifleet-web` — React/Vite SaaS frontend.
- `mlimanifleet-marketing` — public marketing site.

Create a Blueprint from the GitHub repository and inspect the plan, region, build command and environment variables before applying it.

## 3. Required API environment variables

Set these in the `mlimanifleet-api` service:

- `DATABASE_URL` — supplied by the Render PostgreSQL resource through the Blueprint.
- `JWT_SECRET` — generated securely by Render; keep it stable across deploys.
- `WEB_ORIGINS` — exact comma-separated browser origins, e.g. `https://app.mlimani.net,https://erp.mlimani.net` after domains are attached.
- `SUPER_ADMIN_EMAIL` — platform owner login email.
- `SUPER_ADMIN_PASSWORD` — unique password of at least 14 characters; store it in a password manager.
- `SUPER_ADMIN_NAME` — platform owner display name.
- `APP_URL` — `https://app.mlimani.net` once configured.

Optional integrations must remain disabled/unconfigured until tested: Traccar, Resend, Twilio, Selcom and PawaPay. Keep `ENABLE_EXTERNAL_DUE_REMINDERS=false` until consent and delivery have been verified. Subscription payment callbacks are intentionally not trusted until provider-specific signature verification is implemented.

## 4. Frontend environment

Set `VITE_API_URL` on `mlimanifleet-web` to the actual HTTPS URL assigned to `mlimanifleet-api` by Render. Do not add a trailing slash. Do not guess the Render hostname; copy it from the service dashboard.

Attach `app.mlimani.net` to the SaaS frontend and `erp.mlimani.net` to the marketing service. Copy the DNS records Render provides exactly.

## 5. Database setup and first admin

The current Blueprint uses `npx prisma db push` as a pre-deploy schema application step. Before using it on any database containing real data, take a backup and review the Prisma schema changes. For long-term production operations, introduce reviewed, checked-in Prisma migrations and use `prisma migrate deploy` instead of relying on schema push.

After the API is deployed and dependencies/schema are available, run from the API service shell:

```bash
npm run admin:create
npm run db:seed
```

Run the seed only if plan records are not already present. Do not run destructive schema commands against a live database without a backup and review.

## 6. Post-deploy smoke tests

1. Open `https://<actual-api-host>/api/health` and confirm `ok: true`.
2. Sign in as the provisioned platform owner; confirm Platform Admin loads.
3. Register or provision a test company and confirm the company admin can sign in.
4. Create one fleet manager, one accountant, one driver and one viewer; verify the menus and API permissions match their roles.
5. Verify one company cannot read or modify another company's records.
6. Test draft invoice -> submit -> company-admin approval -> partial receipt -> full receipt.
7. Test draft supplier bill -> submit -> company-admin approval -> partial payment -> full payment.
8. Test cash/bank account creation, bank transaction entry and manual reconciliation.
9. Test balanced and unbalanced journal drafts; unbalanced drafts must be rejected.
10. Test loan creation, instalment schedule, partial payment and full payment.
11. Test finance overview, receivables/payables ageing, P&L, cash-flow, asset register, budget-vs-actual and tax CSV export.
12. Test email/SMS only with controlled internal recipients before enabling reminders for external parties.
13. Confirm backups and perform a restore drill before onboarding paying customers.

## 7. Current release gate

This package has passed TypeScript/TSX syntax transpilation only. A full npm dependency install timed out in the build environment; consequently the Prisma client was not generated, Prisma schema validation was not run, full API/frontend typechecks and production builds were not completed, and no PostgreSQL integration or browser tests were run. No Render service or GitHub repository has been deployed or changed from this workspace.

The finance module is still a management system, not a certified double-entry accounting package. A chart of accounts, general-ledger posting engine, trial balance, balance sheet, period locks, statutory tax/payroll computations and bank-statement import/matching remain release blockers before treating it as statutory accounting software.
