# Phase 1 verification

Verified locally on 31 October 2026. No GitHub push, CI execution or deployment has been performed.

## Exact results

| Check | Result |
| --- | --- |
| `python -m pytest -q` from `backend/` | **9 passed, 1 skipped, 1 warning in 12.58s** |
| `npx playwright test` from `frontend/` | **6 passed in 21.2s**, headless Microsoft Edge, against the production frontend build |
| `npm run build` | **Passed**: TypeScript check and Vite production build; **5.26s** Vite build time |
| `npm audit --audit-level=high` | **0 vulnerabilities** at verification time |
| `python -m pip check` | **No broken requirements found** |
| `ruff check backend --select F` | **All checks passed** |
| `ruff format --check backend` | **8 files already formatted** |
| Alembic upgrade → downgrade → upgrade → check | **Passed**, isolated SQLite database, no schema drift detected |
| GitHub authentication / repository permissions | Verified authenticated access to `Mithu2706/odoo`, **push permission available**; no push attempted |

Build artifacts: HTML 0.57 kB, CSS 713.42 kB (86.92 kB gzip), JavaScript 358.72 kB (107.63 kB gzip). Radix's full theme stylesheet accounts for much of the CSS; this has not been presented as a performance benchmark.

## Backend coverage

1. Migration round trip and schema consistency.
2. Registration/login/logout, duplicate email rejection and password policy.
3. Product creation/editing, variants, plan creation, minimum quantity, subscription lifecycle, invoice arithmetic, duplicate billing, future billing rejection, partial/full payment, request idempotency, overpayment rejection and dashboard changes.
4. Staff provisioning/permissions, customer role restrictions and data filtering.
5. Workspace isolation and untrusted-origin rejection.
6. Monthly/yearly calendar anchors.
7. Two customer accounts in the same workspace each see only their own subscriptions, invoices and customer record.
8. Server-owned pricing snapshots, ignored client-supplied prices, and invalid catalog/plan input rejection.
9. HttpOnly cookies, expired/incorrectly signed sessions, and rejection of a forged role claim (permissions are read from the database).

The PostgreSQL concurrent invoice/payment test is **skipped locally** because neither PostgreSQL nor Docker is installed. A CI job is prepared to run that test against PostgreSQL 16 after an authorized push. SQLite tests cannot verify PostgreSQL locks.

One non-failing dependency warning remains: the installed Starlette TestClient deprecates its current `httpx` integration in favor of `httpx2`. The application and tests currently work with the pinned dependency set. This warning is not an application exception.

## Browser coverage

- Customer registration, password-policy error, duplicate email, incorrect login, successful login/logout and session persistence after reload.
- Admin staff provisioning, login as the new Staff user, correct overview after role change, and absence of the admin-only Team navigation.
- Full **Product → Plan → Subscription → Invoice → Payment → Dashboard** workflow, including product editing and subscription lifecycle transitions.
- Staff and Customer one-click demo entry and collection navigation.
- Customer interface has no subscription-creation action and displays only its own seeded subscription.
- Mobile landing/demo/menu at **390 × 844**, with no page-level horizontal overflow. Tables scroll within their own container.

The financial browser test independently verifies **₹225.70 subtotal + ₹40.63 tax = ₹266.33 total**, payment completion, paid invoice state and a **₹266.33 increase in database-derived collected revenue**.

Visual screenshots were inspected for desktop dashboard and mobile invoices. Saved artifacts:

- [Desktop dashboard](screenshots/dashboard.png)
- [Mobile landing](screenshots/landing-mobile.png)
- [Mobile invoices](screenshots/invoices-mobile.png)

## Fixes made during verification

- Corrected a JSX syntax error blocking TypeScript compilation.
- Preserved decimal values as strings in financial API responses.
- Allowed both documented local development origins.
- Added explicit accessible select/navigation labels.
- Cleared stale collection rows and ignored outdated requests during navigation.
- Reset page/data state between login/logout and role changes.
- Used UTC consistently for billing dates.
- Enabled SQLite foreign key enforcement for local relational checks.
- Refreshed locked ORM rows for concurrent PostgreSQL financial operations.
- Replaced the initial model-dependent migration with a frozen explicit schema.
- Pinned tested backend dependencies for reproducible deployment.

## Deployment readiness

**Locally verified and prepared for staging configuration; not yet approved or verified for public production deployment.**

Outstanding gates:

1. Run the prepared integration/concurrency suite on a disposable PostgreSQL database. The Docker image itself has not been built locally because Docker is unavailable.
2. Provision hosting/database, set secrets and configure the real frontend/backend origins. Replace the backend-host placeholder in `frontend/vercel.json`.
3. Verify HTTPS sessions and the complete workflow on the actual public URL after user approval.
4. Add an operational request-rate policy and demo-data cleanup for a long-lived public demo. Demo data is isolated and sessions expire, but rows are not automatically deleted.
5. Measure thousands-of-record performance before claiming the under-two-second target. Pagination exists, but selectors load only 200 entries and some API queries need scale profiling.

Phase 1 limitations and explicitly unimplemented features are listed in [README](../README.md) and [implementation notes](IMPLEMENTATION.md). In particular, invoice generation is manual; email password reset, automatic billing/reminder delivery, tax/discount rule modules and payment gateway charging are not implemented.
