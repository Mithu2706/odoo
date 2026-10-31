# Brightloop

**Subscription & Revenue Intelligence**

Automate recurring billing, manage subscriptions, and protect recurring revenue. Brightloop replaces spreadsheet tracking with a connected product → subscription → invoice → payment workflow and revenue totals calculated from saved records.

Official repository: [Mithu2706/odoo](https://github.com/Mithu2706/odoo)

**Status:** Phase 1 core workflow locally verified (9 backend tests and 6 browser tests passed; one PostgreSQL concurrency test skipped). No public deployment or GitHub push has been performed. A deployed demo URL is not available yet.

## Implemented Phase 1 features

- Customer registration and login, Argon2 password hashes, HttpOnly cookie sessions, unique case-normalized emails and password validation.
- Admin, Staff and Customer permissions enforced by the API; customers see only their own records. Admin-only staff provisioning.
- Customer records; product creation, editing and archiving; variants with additional pricing.
- Daily, weekly, monthly and yearly plans, plan fee, minimum quantity and availability dates; plan editing.
- Subscriptions with saved product/variant prices and the Draft → Quotation → Confirmed → Active → Closed lifecycle.
- Next-due-cycle invoice generation, database duplicate prevention, invoice confirmation and printing.
- Partial and full payments, overpayment rejection, request idempotency and paid/balance status tracking.
- Database-backed revenue totals, payment history, overdue invoices and upcoming billing visibility.
- Responsive dark interface with accessible dialogs, loading/error states and paginated records.
- One-click Admin, Staff and Customer demos. Every entry creates its own sample workspace; demo data cannot access production workspaces.

**Important distinctions:** billing generation is manual in Phase 1, not a running background scheduler. Payment recording does not charge cards or move money. The revenue protection panel highlights saved records; it does not send reminders or make predictions.

## Stack and layout

| Area | Technology / location |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind v4, Radix Themes, Phosphor icons; `frontend/` |
| Backend | Python 3.10+, FastAPI, Pydantic, SQLAlchemy; `backend/app/` |
| Database | PostgreSQL in production, SQLite for quick local evaluation |
| Migrations | Alembic; `backend/migrations/` |
| API tests | pytest + FastAPI TestClient; `backend/tests/` |
| Browser tests | Playwright with installed Edge; `frontend/tests/` |
| Architecture / limits | [Implementation notes](docs/IMPLEMENTATION.md) |

Money is calculated with `Decimal`, stored with `NUMERIC` columns, and serialized as decimal strings. Product-line totals plus the plan fee form the subtotal; tax is rounded half-up to two decimal places. The database uniquely identifies each subscription billing cycle. PostgreSQL row locks serialize financial writes. Monthly billing preserves the original day through shorter months. Billing dates use UTC consistently.

## Local setup (Windows PowerShell)

Requirements: Git, Python 3.10 or newer, Node.js 22 or newer, npm. PostgreSQL 16 or Docker is recommended for production-like verification. Keep database credentials and session keys outside source control.

```powershell
git clone https://github.com/Mithu2706/odoo.git
cd odoo
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.lock.txt
cd frontend
npm.cmd ci
cd ..
```

### Start the API using SQLite

Run in a terminal from the repository root:

```powershell
$env:SECRET_KEY = .\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(48))"
$env:DATABASE_URL = 'sqlite:///./brightloop.db'
$env:DEMO_ENABLED = 'true'
$env:CORS_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173'
cd backend
..\.venv\Scripts\python.exe -m alembic upgrade head
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

`SECRET_KEY` must have at least 32 characters. Keep the same secret between server restarts if you want existing sessions to remain valid. The command above generates a temporary development secret. SQLite creates an ignored local database in `backend/`.

In a second terminal:

```powershell
cd frontend
npm.cmd run dev
```

Open **http://127.0.0.1:5173**. Vite proxies `/api` to port 8000. API health: `http://127.0.0.1:8000/api/health`; interactive API documentation: `http://127.0.0.1:8000/docs`.

Environment examples are in `backend/.env.example`. The application reads process environment variables; `.env` files are not loaded automatically. You may explicitly use Uvicorn's `--env-file .env` after copying and configuring the example. Migrations still require `DATABASE_URL` in the shell environment.

### PostgreSQL locally

If Docker is installed, start PostgreSQL from the root:

```powershell
$env:POSTGRES_PASSWORD = Read-Host 'Choose a local database password'
docker compose up -d db
$env:DATABASE_URL = 'postgresql+psycopg://brightloop:YOUR_URL_ENCODED_PASSWORD@localhost:5432/brightloop'
cd backend
..\.venv\Scripts\python.exe -m alembic upgrade head
```

Use the actual password in the URL; URL-encode special characters. An existing PostgreSQL server works too: create a dedicated `brightloop` database and user, then set its connection URL. SQLite is for local development; PostgreSQL is required for reliable concurrent financial writes.

### Create the production administrator

With the same `DATABASE_URL` and `SECRET_KEY` configured, run from `backend/`:

```powershell
..\.venv\Scripts\python.exe -m app.bootstrap
```

The interactive command prompts for name, email and a hidden password. There are no hardcoded production credentials. Only administrators can create staff accounts through the Team screen.

Public registration creates an isolated customer workspace. It does not link unverified emails to an existing company's financial records. To provision access to an existing customer record, an administrator can call `POST /api/customers/{id}/account` with that record's email, name and a policy-compliant password. For API-only provisioning, open the backend `/docs`, sign in with `POST /api/auth/login`, then call the provisioning endpoint using the resulting cookie on that API origin. Customer account provisioning currently has an API endpoint, not an admin UI form.

## Jury demo walkthrough

1. On the landing page, select **Explore Live Demo**. Staff and Customer entries are also available.
2. Open **Products**, create/edit a product, and use Edit to add a price-adjusting variant.
3. Open **Plans** and create a billing plan. The plan fee is charged once per cycle in addition to product lines.
4. Open **Subscriptions**, add a customer, plan, product, quantity and start date. The frontend supports one product line; the API accepts multiple lines.
5. Open the new subscription. Move it to quotation, confirmed, then active.
6. For a cycle due today or earlier, select **Generate next due invoice**. Future cycles cannot be billed. For missed cycles, generate each next due cycle in order.
7. Open **Invoices**, open the draft invoice and confirm it.
8. Open **Payments**, select the confirmed invoice and record a sample payment.
9. Return to **Overview** and observe collected revenue and outstanding balance update.

The demo selector opens a fresh workspace for the selected role. Changes do not transfer between role demos. Demo sessions expire after eight hours; demo rows remain stored until an operator removes them. Use a separate demo database for a public competition instance, with an appropriate cleanup and request-rate policy.

## Tests and builds

Backend integration tests (from `backend/`):

```powershell
..\.venv\Scripts\python.exe -m pytest -q
```

Tests cover authentication, duplicate email/password validation, role permissions, same-workspace customer isolation, cross-workspace isolation, product editing, variants, plans, quantity rules, saved prices, lifecycle transitions, invoice arithmetic, duplicate requests, partial/full payments, overpayments, dashboard changes and billing-date anchors.

For PostgreSQL tests, create a **separate disposable test database**, then set `TEST_DATABASE_URL` to its SQLAlchemy connection URL. The suite creates and drops application tables. Never point it at a production database. PostgreSQL also enables the concurrent invoice/payment test, skipped on SQLite. A GitHub Actions workflow is prepared for PostgreSQL integration tests and a frontend build; it has not run remotely before push.

Frontend type check and production build (from `frontend/`):

```powershell
npm.cmd run build
```

Browser integration tests require the API and frontend servers described above, with demo mode enabled:

```powershell
npx.cmd playwright test
```

The default test browser is installed Microsoft Edge. On another platform, install Edge with Playwright or update `playwright.config.ts` to use Chromium and run `npx playwright install chromium`. Tests include the full financial workflow, all three demo roles, navigation and a 390-pixel mobile layout. Screenshots are saved under `docs/screenshots/` and the desktop/mobile results are linked in the verification report; failure traces are ignored under `frontend/test-results/`.

See [verification results](docs/VERIFICATION.md) for the actual local results and remaining deployment gates. Passing SQLite tests does not establish PostgreSQL locking behavior or the under-two-second scale target.

## Deployment preparation

No deployment has been performed. Deployment requires the owner's confirmation and hosting account access.

### Backend: Render or a compatible Docker host

1. Provision managed PostgreSQL and use its private connection URL with the `postgresql+psycopg://` driver prefix. Use provider-required TLS parameters for external connections.
2. Create a Docker web service with root directory `backend/`; its Dockerfile installs dependencies, applies Alembic migrations and starts Uvicorn on `$PORT`.
3. Set secrets/configuration through the hosting dashboard:

| Variable | Production value |
| --- | --- |
| `DATABASE_URL` | Managed PostgreSQL URL; never commit it |
| `SECRET_KEY` | Random persistent secret, at least 32 characters |
| `CORS_ORIGINS` | Exact HTTPS frontend origin, no trailing slash; comma-separated if needed |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `lax` when using the same-origin frontend API proxy |
| `DEMO_ENABLED` | `true` only for the isolated competition demo instance |

4. Configure `/api/health` as the health check. Create the first admin with the bootstrap command in the service shell if needed.
5. For multiple backend instances, run migrations as a single release task rather than concurrently in every container. Add edge rate limits for authentication/demo creation, database backups, logging/monitoring and expired demo cleanup before a long-lived public launch.

### Frontend: Vercel

1. Set the project root to `frontend/`, install with `npm ci`, build with `npm run build` and publish `dist/`.
2. Replace `YOUR-BACKEND.onrender.com` in `frontend/vercel.json` with the actual backend host before deploying. This is an explicit configuration placeholder, not a working deployment.
3. Keep `/api` under the frontend origin using that rewrite. This preserves HttpOnly first-party cookies without exposing tokens to browser JavaScript. Add the actual Vercel origin to backend `CORS_ORIGINS`.
4. Verify HTTPS login, session cookies, all demos and the full billing workflow on the actual public URL. Test PostgreSQL transactions and concurrency before accepting real financial data.

### Still outside Phase 1

Email password reset, email invoice/reminder delivery, scheduled automatic billing, invoice cancellation, quotation templates/validity, tax/discount rule modules, pause/proration/automatic closure rules, payment gateway processing, predictive risk scoring and revenue simulations are not implemented. There are no buttons claiming these features work.

Current limits: INR only; record selectors load up to 200 entries; search filters the current 50-row page; demo datasets need operational cleanup. Performance with thousands of subscriptions has not been established. The dashboard history scans matching payments and record collections have some per-record lookups, so scale profiling and query optimization remain necessary.
