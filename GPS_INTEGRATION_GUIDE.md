# MlimaniFleet GPS integration — setup guide

This update adds the GPS Tracking page, tenant-scoped GPS API routes, PostgreSQL models for GPS devices and position history, phone geolocation reporting, and a Traccar hardware sync adapter.

## 1. Deploy the existing MlimaniFleet stack

1. Extract the updated project ZIP.
2. Copy `.env.example` to `.env` and configure `DATABASE_URL`, a strong `JWT_SECRET` (32+ random characters), `WEB_ORIGIN`, and a secure super-admin account.
3. Install dependencies from `apps/api` and `apps/web` with `npm install`.
4. Apply the updated Prisma schema in development with `npx prisma generate` and `npx prisma db push` from `apps/api`. For production, create and review a migration in a controlled environment, then deploy migrations with `npx prisma migrate deploy`.
5. Start the API and web app. Set `VITE_API_URL` in the web build environment to the public HTTPS URL of the MlimaniFleet API. Set `WEB_ORIGIN` on the API to the web app's exact origin.
6. Open **GPS Tracking** and sign in, or create an organization account. GPS APIs require a valid JWT and use the authenticated organization to scope devices, vehicles, and positions.

## 2. Phone GPS

1. Sign in to the organization workspace.
2. Under GPS Tracking, add the vehicle to the live database if it is not listed.
3. Select that vehicle and choose **Start phone tracking**.
4. Grant the browser location permission. Use HTTPS outside localhost.
5. Keep the page open while tracking. The browser sends points roughly every 10 seconds while new location updates arrive.

Phone GPS is suitable for pilots and driver-assisted tracking. Mobile browsers and operating systems can pause location updates in the background or when the device is locked. For dependable always-on tracking, use a dedicated tracker or build a native driver app with the appropriate background-location permissions and consent controls.

## 3. Dedicated vehicle GPS hardware

1. Deploy a Traccar server on infrastructure that supports the required tracker TCP/UDP ports. The API and Traccar server must be able to communicate over HTTPS/HTTP; restrict this access using firewall rules and TLS where supported. Traccar is separate from the MlimaniFleet web app.
2. Add the GPS hardware model to Traccar's supported device protocols. Install a working SIM/data plan and configure the tracker with the Traccar server address and the correct protocol/port for that exact model.
3. Confirm that the device appears in Traccar and that its `uniqueId` and live position are visible there. Do not assume all trackers use the same protocol or port; follow the hardware vendor and Traccar setup instructions.
4. Set these environment variables on the MlimaniFleet API service only:
   - `TRACCAR_URL` — base URL of the Traccar HTTP API, e.g. `https://traccar.example.com`
   - `TRACCAR_USERNAME` — dedicated least-privilege Traccar API account
   - `TRACCAR_PASSWORD` — strong unique password
5. In MlimaniFleet → GPS Tracking, add the vehicle to the live database if needed. Register a **Dedicated hardware via Traccar** device with the exact Traccar `uniqueId`.
6. Select **Sync hardware from Traccar**. The API imports new positions for hardware devices registered to the signed-in organization. Repeat sync to refresh positions.

Never place Traccar credentials in frontend variables, browser code, GitHub, or a public repository. The current integration uses manual sync initiated by an authenticated user; a scheduled worker and live streaming can be added after connectivity is proven.

## 4. API overview

All endpoints below require `Authorization: Bearer <JWT>` except the admin endpoint requires the `SUPER_ADMIN` role:

- `GET /api/gps/devices`
- `POST /api/gps/devices`
- `DELETE /api/gps/devices/:id`
- `GET /api/gps/positions/latest`
- `POST /api/gps/phone/position`
- `GET /api/gps/vehicles/:vehicleId/history?from=<ISO>&to=<ISO>`
- `POST /api/gps/traccar/sync`
- `GET /api/admin/gps-settings` (super-admin only)

The schema stores GPS positions with timestamps, coordinates, speed, course and optional altitude. Route history is currently limited to 2,000 points per request.

## 5. Production checklist before customer rollout

- Test with one hardware tracker and one phone on a test organization before onboarding customers.
- Add automated tenant-isolation tests and role-level authorization checks, including driver-to-vehicle assignment restrictions.
- Add a background sync worker, WebSocket/SSE updates, geofence rules, alerts, monitoring, and a GPS data-retention cleanup job.
- Decide on retention, location-access consent, employee notices, customer terms, and incident-response procedures.
- Use HTTPS, rotate credentials, limit Traccar API account permissions, restrict server networking, and monitor API errors.
- Validate map attribution and terms for the selected map provider before production use.

This is an integration foundation, not a production-certified telematics system. Hardware sync, phone tracking, and database changes must be tested in the target deployment before relying on GPS for dispatch, safety, or billing decisions.


## Background polling

When `TRACCAR_URL`, `TRACCAR_USERNAME` and `TRACCAR_PASSWORD` are set on the API service, the server polls Traccar every 60 seconds and records positions only for registered hardware unique IDs. The manual sync endpoint remains available. Position history is automatically pruned according to `GPS_RETENTION_DAYS` (minimum seven days, default 90). Phone tracking is browser-based and requires HTTPS; the tracking page must remain open because mobile browsers can suspend background location.
