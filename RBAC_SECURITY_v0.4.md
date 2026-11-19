# MlimaniFleet v0.4 — Account roles and security

## Account hierarchy

- `SUPER_ADMIN`: platform owner. No tenant is attached. Can access the platform control centre, global company register, platform-level settings and subscription/payment administration endpoints.
- `ORG_ADMIN`: company administrator. Scoped to one organisation; can manage company users and workspace configuration. Cannot grant `SUPER_ADMIN` or create another `ORG_ADMIN` through company user management.
- `FLEET_MANAGER`: fleet operations write access (vehicles, drivers, trips, fuel, maintenance and fleet documents); no platform-wide administration or accounting administration.
- `ACCOUNTANT`: finance and accounting functions. Fleet write endpoints are denied.
- `DRIVER`: restricted driver-facing trip/GPS navigation; cannot create or modify general company records.
- `VIEWER`: read-only navigation; mutation APIs deny this role.

## Implemented in this release

- Server derives role, account status and organisation from the database on every authenticated request; JWT role claims are not trusted as current authority.
- Company user list/create/update APIs are scoped to the authenticated organisation.
- Company user creation hashes passwords with bcrypt cost 12 and requires at least 10 characters.
- Tenant administrators cannot grant platform-owner privileges or create another company administrator.
- Users cannot demote/deactivate themselves; the final active company administrator cannot be demoted/deactivated.
- Another company administrator cannot be modified by a tenant administrator.
- General fleet write access is limited to `ORG_ADMIN`, `FLEET_MANAGER`, and `SUPER_ADMIN`; accounting writers are separately restricted to finance-authorized roles.
- Sidebar navigation is role-specific. Platform Owner sees a separate Platform Admin entry; company admins see Users & Roles.
- Platform Owner Control Centre now reads live platform counts and the tenant register from protected APIs; tenant status changes are recorded through the protected platform endpoint.

## Provisioning the Platform Owner

Use the server-side `npm run admin:create` script with `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` (minimum 14 characters), and optional `SUPER_ADMIN_NAME`. Never expose these values in the browser, source control, or public registration form. The script provisions the account without an organisation.

## Before production

1. Apply and verify Prisma schema/migrations on a staging database first.
2. Run the role matrix acceptance tests for every endpoint and every role.
3. Configure MFA/SSO or at minimum enforce strong unique passwords and account recovery controls.
4. Add login throttling, password reset, invitation expiry and email verification.
5. Review every route for least privilege, especially accounting approvals, exports, GPS and file access.
6. Keep secrets in Render environment variables; rotate credentials after any suspected exposure.
7. Configure immutable audit retention and backup/restore tests.

This document describes implemented application controls plus remaining production-hardening work. It is not a claim of independent security certification.
