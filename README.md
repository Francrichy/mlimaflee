# MlimaniFleet — Fleet Management SaaS Starter

Responsive English/Swahili fleet ERP starter with React/Vite frontend, Express API, PostgreSQL schema, tenant-scoped records, admin-adjustable pricing, and payment gateway adapter scaffolds for Selcom and PawaPay.

## Features in this starter
- Responsive dashboard and navigation
- Installable Progressive Web App (PWA): add to home screen on supported Android/iOS browsers and install on desktop browsers; offline shell only, live data still requires internet
- English / Kiswahili language toggle
- Fleet, vehicles, drivers, maintenance, fuel/expenses, trips, reports, and settings modules (starter UI)
- Platform super-admin pricing tiers, organization suspension, subscription/payment listing, editable trial/grace-period policies and provider configuration status endpoints
- Pricing configured in database; initial suggested tiers seeded
- JWT authentication and tenant scoping
- PostgreSQL schema with users, organizations, vehicles, drivers, expenses, maintenance, trips, plans, subscriptions, payments, and audit logs
- Payment initiation/webhook scaffolds for Selcom and PawaPay
- Docker Compose for local PostgreSQL + API + web

## Important production checklist
This is a runnable starter, not a production-certified financial system. Before charging customers:
1. Complete and test provider-specific Selcom/PawaPay signatures, API credentials, callbacks, idempotency, reconciliation, refunds, and production credentials against their current official documentation.
2. Configure HTTPS, secrets, database backups, rate limiting, email/SMS delivery, monitoring, error reporting, and a production deployment.
3. Add comprehensive authorization tests and independent security review.
4. Confirm tax/invoice requirements and terms/privacy policies for your markets.
5. Never mark a payment successful based only on a browser redirect; only verified server-side provider callbacks can do that.

## Local development
Requirements: Node.js 20+, Docker Desktop.

1. Copy `.env.example` to `.env` and replace secrets.
2. Run `docker compose up --build`.
3. Web: http://localhost:5173
4. API health: http://localhost:4000/api/health

Seeded demo login is disabled by default. Register a new organization through `/api/auth/register`. To provision the platform super-admin, set `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` (14+ characters) and optional `SUPER_ADMIN_NAME`, then run `npm run admin:create` from `apps/api`. The script does not ship with a default password. Seed plan pricing with `npm run db:seed`.

## App installation
The frontend is a Progressive Web App (PWA). Deploy it over HTTPS, then use the browser's **Install app** or **Add to Home Screen** action. This gives users an app-like icon and full-screen experience on mobile and desktop without maintaining separate native iOS/Android projects. It does not yet provide native push notifications or offline transaction syncing.

## Public domains
- `https://erp.mlimani.net`: public product introduction and services website.
- `https://app.mlimani.net`: authenticated SaaS application.
- The marketing site directs customers to the app for account registration and sign-in.
- Configure both exact HTTPS origins in the API `WEB_ORIGINS` variable and set the web app `VITE_API_URL` to the Render API service URL. See `DOMAIN_AND_SAAS_SETUP.md`.

## Architecture
- `apps/web`: React, Vite, TypeScript, Tailwind CSS, React Router, Recharts, Lucide
- `apps/api`: Express, TypeScript, Prisma, PostgreSQL, JWT, Zod
- `apps/api/prisma/schema.prisma`: data model
- `apps/api/src/payments`: gateway abstraction and provider scaffolds

## GPS tracking integration

The GPS module supports two sources:

- **Dedicated hardware trackers:** connect compatible GPS devices to a Traccar server, register each Traccar `uniqueId` against a vehicle in MlimaniFleet, then use **GPS Tracking → Sync hardware from Traccar**. The API reads `/api/devices` and `/api/positions` from Traccar using server-side credentials.
- **Driver phone GPS:** an authenticated driver/manager can select a vehicle and start browser geolocation. The browser must grant permission and the site must use HTTPS outside `localhost`. Keep the page open; mobile operating systems may suspend background browser tracking.

### GPS database and API

After updating the project, apply the Prisma schema and generate the client:

```bash
cd apps/api
npm install
npx prisma generate
npx prisma db push
```

Set `TRACCAR_URL`, `TRACCAR_USERNAME`, and `TRACCAR_PASSWORD` in the API service environment. Do not put these credentials in the web app or commit them to Git. Compatible hardware must first be configured to report to the Traccar server; device protocol and network/SIM setup depend on the tracker model.

Authenticated endpoints:

- `GET /api/gps/devices` — company-scoped registered devices
- `POST /api/gps/devices` — register a device for a vehicle
- `DELETE /api/gps/devices/:id` — remove a company-owned device and its location history
- `GET /api/gps/positions/latest` — latest position per enabled device
- `POST /api/gps/phone/position` — store a phone GPS point for a company-owned vehicle
- `GET /api/gps/vehicles/:vehicleId/history?from=<ISO>&to=<ISO>` — route points in a time window (max 2,000)
- `POST /api/gps/traccar/sync` — import new positions from Traccar for registered hardware devices belonging to the signed-in organization
- `GET /api/admin/gps-settings` — super-admin-only configuration status

The GPS API is tenant-scoped. This starter currently requires a valid MlimaniFleet JWT for these endpoints; the GPS module includes its own sign-in/register panel. The rest of the fleet ERP dashboard remains starter/demo UI and still needs full API/auth integration. Hardware sync is currently user-triggered, not a continuous background worker. Route playback, push notifications, geofence management, driver-specific authorization, retention cleanup jobs, and production monitoring are follow-up work. Test with a development tracker and a test organization before using real fleets.

## Profit & Loss module

The UI includes a fleet-wide P&L and per-truck profitability screen. Current displayed amounts are demo figures until financial APIs and posted accounting records are connected. See `PROFIT_LOSS_MODULE.md` for the required backend and accounting work.

## Accounting backend

See [`ACCOUNTING_BACKEND_GUIDE.md`](./ACCOUNTING_BACKEND_GUIDE.md) for invoice and collection workflows, supplier bills/payables, cash-flow, payroll entries, tyres, asset depreciation, trip/customer/contract profitability, budgets, ageing reports, tax CSV export, approvals and Render setup. This is an initial backend implementation and requires integration testing, a posting ledger, and tax/accounting review before production.


## Operational modules (v0.2)

The current implementation adds live, tenant-scoped workflows for: vehicle and driver registers; trip planning, dispatch and delivery confirmation; fuel transactions and efficiency; maintenance and repairs; tyre stock/install/remove lifecycle; GPS device registration, phone GPS, Traccar polling and position history; trip and operating expenses; customers, suppliers, invoices, receipts, supplier bills/payments, cash/bank accounts and reconciliation, driver payments, loans/instalments, budgets, assets, contracts and approvals; profitability and management reports; and compliance documents with scheduled expiry reminders.

All new operational records are scoped by the authenticated organisation. Mutations require a write-capable role; accounting workflows require an organisation admin or accountant. Vehicle deletion is blocked while linked operational records exist. The dashboard now derives KPIs, weekly costs and recent activity from saved database records rather than sample fleet events.

### Applying the schema update

Back up the production PostgreSQL database first. Then deploy the updated API so Prisma Client is generated and the additive schema update is applied by the configured Render pre-deploy command. Verify the health endpoint and test each workflow using a non-production organisation before enabling staff access. Do not run schema changes against production without a recent backup.

### External integrations that require credentials

- **GPS hardware:** configure `TRACCAR_URL`, `TRACCAR_USERNAME` and `TRACCAR_PASSWORD`. The API polls registered hardware IDs every 60 seconds. Phone GPS requires HTTPS and the driver's page to remain open; mobile browsers may suspend background location.
- **Email reminders:** configure `RESEND_API_KEY` and `REMINDER_FROM_EMAIL`. Payment reminders run every six hours; compliance reminders run daily.
- **SMS reminders:** configure Twilio and explicitly set `ENABLE_EXTERNAL_DUE_REMINDERS=true` only after obtaining consent and validating local messaging requirements.
- **Payments:** Selcom/PawaPay remain disabled for live collection until provider credentials, signed callback verification and end-to-end settlement tests are complete. The current webhook handler intentionally refuses to mark payments successful without provider verification.
- **Document files:** the compliance register stores document metadata and a secure file URL. A production file-storage provider and upload credentials must be configured before direct file uploads are enabled.

### Current release validation

TypeScript/TSX source transpilation syntax checks pass. Full dependency installation, Prisma schema validation/client generation, PostgreSQL integration tests, browser end-to-end tests and Render deployment have not been completed in this environment. Treat this package as an implementation release candidate, not as a verified production deployment.

See `IMPLEMENTATION_STATUS_v0.2.md` for the exact implementation and validation boundary, and `OPERATIONAL_ACCEPTANCE_TESTS.md` for staging sign-off checks.
