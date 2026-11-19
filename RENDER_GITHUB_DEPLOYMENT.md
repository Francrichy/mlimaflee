# MlimaniFleet: GitHub and Render deployment

This repository is a deployable **starter/foundation**, not yet a fully production-complete ERP. The GPS page and API are included, but several non-GPS ERP screens still use demo data or placeholders. Selcom/PawaPay collection and verified webhooks are not production-ready. Do not charge customers or use it as the sole record system until those gaps are completed and tested.

## 1. Upload to GitHub

1. Download and extract the ZIP.
2. Create a new **private** repository on GitHub named `mlimanifleet` (recommended while the project is under development).
3. Upload the contents of the `mlimanifleet` folder to the repository root. The `render.yaml` file must be at the repository root, not inside another nested folder.
4. Do not upload `.env` files, passwords, API keys, database URLs, or GPS provider credentials. Use Render environment variables only.
5. If using Git locally, from the extracted `mlimanifleet` directory run:

```bash
git init
git add .
git commit -m "Initial MlimaniFleet SaaS with GPS integration"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/mlimanifleet.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username. If GitHub already created a README or other files, either create an empty repository first or pull/reconcile those files before pushing.

## 2. Deploy through Render Blueprint

1. Sign in to Render and choose **New → Blueprint**.
2. Connect the GitHub repository and select the branch, normally `main`.
3. Render reads `render.yaml` and proposes a PostgreSQL database, an API web service, and a static web frontend.
4. Review the plan and costs before applying. The database plan in `render.yaml` may need changing to one currently offered by your Render account/region.
5. Complete the prompted environment variables. For the frontend, `VITE_API_URL` must be the full HTTPS URL of the deployed API, for example `https://mlimanifleet-api.onrender.com`. For the API, `WEB_ORIGIN` must be the full HTTPS URL of the frontend, for example `https://mlimanifleet-web.onrender.com`.
6. If Render asks for values before service URLs exist, deploy the services first, then set these two variables in the service dashboards and trigger a new frontend deploy. `VITE_API_URL` is compiled into the frontend at build time.
7. Keep Traccar credentials blank until you have a reachable Traccar server. Add its URL and credentials to the API service only; never expose them as `VITE_` variables.

## 3. Initialize the database

After the API and database exist, open the API service's Shell in Render (if available) or run the commands in a secure environment with the same production `DATABASE_URL`:

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

Run these commands from the API service directory (`apps/api`). If the Render Shell starts in the repository root, change directory to `apps/api` first. Confirm the API responds at `https://YOUR-API-URL/api/health` with `{"ok":true,...}`.

## 4. Create the platform super-admin

Set these environment variables on the API service before running the one-time command:

- `SUPER_ADMIN_EMAIL`: your intended administrator email
- `SUPER_ADMIN_PASSWORD`: a unique password of at least 14 characters
- `SUPER_ADMIN_NAME`: display name

Then run `npm run admin:create` from `apps/api`. Remove `SUPER_ADMIN_PASSWORD` from the service environment after successful creation. Store credentials in a password manager and do not commit them to GitHub. This project currently requires manual validation of admin access and does not yet have a complete production super-admin frontend.

## 5. GPS setup

- Phone GPS requires the frontend to use HTTPS, browser location permission, and the tracking page to remain open. Mobile browsers may suspend background tracking.
- For hardware GPS, deploy a Traccar server separately, configure compatible devices to report to it, then set `TRACCAR_URL`, `TRACCAR_USERNAME`, and `TRACCAR_PASSWORD` on the API service. Add each device's exact Traccar unique ID against the correct vehicle.
- Test with one development organization, one phone, and one hardware tracker before using real fleet data. Hardware synchronization in this version is manually triggered, not a continuous background worker.

## 6. Before production customers

- Complete all ERP forms and connect each screen to the API; current overview and several modules are demo/placeholder UI.
- Implement and test verified Selcom/PawaPay requests, signatures, webhook verification, idempotency, reconciliation, refunds, and subscription activation.
- Add authorization and tenant-isolation tests, request rate limiting, input/output auditing, backups/restore drills, monitoring, and retention cleanup jobs.
- Configure a real email/SMS service, legal terms/privacy notices, support processes, and an incident response plan.
- Review current Render pricing, database availability, sleep/uptime behavior, and backup options before choosing a production plan.

## Scheduled finance reminders

On the `mlimanifleet-api` service, set `RESEND_API_KEY` and `REMINDER_FROM_EMAIL` to enable staff email reminders. Set the Twilio environment variables to enable SMS transport, but leave `ENABLE_EXTERNAL_DUE_REMINDERS=false` until external customer/supplier SMS has been explicitly approved. The unified reminder API is `GET /api/accounting/reminders?days=90`. Reminder attempts and failures are recorded for review.

Before production rollout, deploy the updated Prisma schema and run the accounting verification script against a test PostgreSQL database as documented in `ACCOUNTING_BACKEND_GUIDE.md`. Do not run destructive schema operations against production without a backup and a reviewed migration plan.
