# MlimaniFleet domain and SaaS deployment guide

## Confirmed domain allocation

- `https://app.mlimani.net` — authenticated MlimaniFleet SaaS application (`mlimanifleet-web` Render Static Site).
- `https://erp.mlimani.net` — public MlimaniFleet product and services website (`mlimanifleet-marketing` Render Static Site).
- `mlimanifleet-api` — private API service URL supplied by Render; the API is not hosted on either public website hostname.

The marketing site links sign-in and workspace registration actions to `https://app.mlimani.net`. The app must use the API service URL in `VITE_API_URL`. `APP_URL` remains `https://app.mlimani.net`.

## Render custom-domain setup

1. Open Render and select the `mlimanifleet-web` Static Site. Add custom domain `app.mlimani.net`.
2. Select `mlimanifleet-marketing`. Add custom domain `erp.mlimani.net`.
3. For each domain, copy the exact DNS record name, type, and target displayed by Render into the authoritative DNS provider for `mlimani.net`. Do not substitute guessed CNAME targets or reuse one service's target for the other.
4. Wait for Render to verify both records and issue HTTPS certificates. Keep the previous working deployment/domain configuration until each new hostname passes HTTPS checks.
5. In the API service, set `WEB_ORIGINS` to exactly `https://app.mlimani.net,https://erp.mlimani.net` (add local development origins only where needed).
6. In the web Static Site, set `VITE_API_URL` to the actual Render API service URL, with no trailing slash. Redeploy the web site after changing it.
7. Confirm `APP_URL=https://app.mlimani.net` in the API service. The marketing domain is not the app's canonical URL.

## Render Blueprint services

The root `render.yaml` defines the PostgreSQL database, API, authenticated web app, and marketing web app. Review the generated service settings in Render before applying the Blueprint. Keep production credentials in Render environment variables, never in Git. The API's `WEB_ORIGINS` is intentionally a manual setting (`sync: false`) so the owner can confirm the allowed origins.

## Production acceptance checks

- [ ] `https://app.mlimani.net` serves the authenticated SaaS app over valid HTTPS.
- [ ] `https://erp.mlimani.net` serves the public product website over valid HTTPS.
- [ ] Marketing sign-in and get-started links open `https://app.mlimani.net`.
- [ ] App API requests use the Render API URL from `VITE_API_URL`.
- [ ] API CORS permits the two exact HTTPS origins and rejects unapproved browser origins.
- [ ] `GET /api/health` reports the API healthy.
- [ ] Registration and login create a JWT session; `/api/me` returns the authenticated user and organization. Password reset, tenant isolation and role permissions still require acceptance tests.
- [ ] PostgreSQL records survive a second redeploy and a database backup/restore test is completed.
- [ ] Super-admin password is changed/provisioned securely; no default credentials remain.
- [ ] Payment and external reminders remain disabled until provider credentials, webhook verification, idempotency and reconciliation tests pass.

## SaaS security and product readiness

All tenant-owned reads, updates and deletes must be scoped by `organizationId`. Super-admin permissions must remain separate from organization-admin permissions. GPS credentials, payment secrets, JWT secrets and email/SMS credentials must remain server-side. Run reviewed database migrations before production releases; do not treat `prisma db push` as a long-term migration strategy.

The current codebase is a development foundation, not a production-certified ERP. Dashboard demo values and unfinished API integrations must be replaced and acceptance-tested before advertising those functions as fully operational. GPS hardware sync is currently user-triggered; continuous tracking and geofence automation are not complete.


## Operational release notes

The app now includes live register screens and API workflows for vehicles, drivers, trips, fuel, maintenance, tyres, compliance documents, expenses and finance ledgers. Trip dispatch and delivery confirmation, tyre installation/removal, invoice/bill approval, receipt/payment recording, bank reconciliation, driver payment marking and loan instalment payments are available from the workspace.

The API polls Traccar hardware devices every 60 seconds when configured. Scheduled email reminders require Resend credentials; SMS remains opt-in and disabled by default. Before production rollout, back up PostgreSQL, deploy the additive Prisma schema, run the acceptance tests in README, and validate roles/tenant isolation with at least two separate test organisations.
