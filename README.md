# MlimaniFleet SaaS v1 foundation

Single Render web service: Express serves the web UI and `/api` from the same origin (`https://app.mlimani.net`). PostgreSQL stores tenant data. The company context is taken from the signed-in user token; all company list/create endpoints scope by `companyId`.

## Included in this foundation
- Company registration and login, bcrypt password hashing, signed 12-hour JWTs, rate limiting and security headers.
- Platform owner role, company roles and server-side permission checks.
- Automatic 14-day trial expiry and paid-through suspension checks; platform owner can activate, suspend and extend a subscription.
- Company-scoped vehicle, driver, trip, fuel, expense, maintenance, tyre, document and GPS position data models.
- Basic vehicle, driver, trip, fuel and expense create/list APIs; fleet summary API.
- Responsive web UI with sign-in, free-trial registration, fleet dashboard, record lists, forms and platform company console.
- Render Blueprint file for a single web service and PostgreSQL database.

## Important scope limits
This is a deployable application foundation, not yet a fully audited production ERP. The current UI marks accounting, reporting, GPS map, user administration and some operational workflows as foundations. The database has basic invoice/payment/customer/supplier entities, but a complete double-entry general ledger, posting controls, journal approval/reversal, bank reconciliation, payroll statutory calculations, TRA/EFD certification, live map provider, Traccar background synchronisation, document object storage, subscription payment gateway/webhook verification, full per-action permission editor, integration tests and backup/restore drills must be completed before onboarding paying customers.

## Local setup
1. Copy `.env.example` to `.env` and fill in a PostgreSQL `DATABASE_URL` and a random `JWT_SECRET` (32+ characters).
2. `npm install`
3. `npx prisma generate`
4. `npx prisma db push`
5. Set `PLATFORM_OWNER_EMAIL`, `PLATFORM_OWNER_PASSWORD` (14+ characters), and `PLATFORM_OWNER_NAME`.
6. `npm run db:seed`
7. `npm start`
8. Open `http://localhost:10000`.

## Render deployment — single domain, one service
Because the user already has a Render PostgreSQL database, do not create a second database from the Blueprint. Connect the existing database manually:
1. Push this project to the private GitHub repository (or merge it into the existing `Francrichy/fleetnyumbani` repository only after reviewing its current files).
2. Render Dashboard → existing Mlimani Fleet Web Service → Settings. Set Root Directory blank/repository root, Build Command `npm install && npx prisma generate`, Start Command `npm start`, Health Check Path `/api/health`.
3. Environment: `NODE_ENV=production`; `DATABASE_URL` = the existing database's **Internal Database URL**; `JWT_SECRET` = generated long random secret; `APP_URL=https://app.mlimani.net`; `TRIAL_DAYS=14`; `PLATFORM_OWNER_EMAIL`, `PLATFORM_OWNER_PASSWORD`, `PLATFORM_OWNER_NAME`.
4. Deploy the service. The Free web service does not provide Render Shell/SSH access, so run the initial database setup from your own computer: temporarily set `DATABASE_URL` to the existing database **External Database URL** in a local `.env`, then run `npx prisma generate`, `npx prisma db push`, and `npm run db:seed` from this project folder. Do not commit `.env`. This schema push is appropriate only for an empty test database. For later changes, use reviewed Prisma migrations and take a backup first. The running Render service itself should use the database **Internal Database URL**.
5. Confirm `https://YOUR-RENDER-SERVICE.onrender.com/api/health` returns `{"ok":true,...}`.
6. Render service → Settings → Custom Domains → add `app.mlimani.net`. Copy the exact DNS target Render provides.
7. Cloudflare DNS → add the CNAME record using Render's exact target. Set proxy status to DNS only initially while validating, then enable Cloudflare proxy if compatible with your Render domain setup. Keep SSL/TLS mode Full (strict) after origin certificate is active.
8. Visit `https://app.mlimani.net`, register a test company, add a vehicle and test tenant separation before importing live records.

## Free-tier warning
Render Free web services sleep after 15 minutes without traffic and can take about a minute to wake. Free Render Postgres is limited to 1 GB, has no backups, and expires 30 days after creation; after the 14-day grace period Render deletes the database and its data. Use free resources only for a temporary test/pilot with no irreplaceable records. Upgrade the database or migrate it before the expiry date, and arrange independent backups before storing real fleet or accounting records.

## Existing project compatibility
The earlier MlimaniFleet project used React/TypeScript + Express + Prisma/PostgreSQL and had additional accounting/GPS work. This package is a separate single-service starter so it does not overwrite that work. Its `render.yaml` defines only a web service and asks for `DATABASE_URL`; it does not create another database. Review/merge rather than replacing the existing repository blindly. Existing Render DB contents must be backed up and its schema inspected before any schema push.
