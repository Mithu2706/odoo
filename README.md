# Brightloop — Subscription & Revenue Intelligence

Brightloop is a production-grade subscription lifecycle, recurring billing automation, and billing assurance platform. Built to eliminate revenue leaks, silent invoice failures, and manual reconciliation, Brightloop couples a deterministic financial calculation engine with an **Obligation Ledger** and **Billing Assurance Center** that guarantees every billable cycle is accounted for, mathematically reconciled, and protected against duplicates.

Official Repository: [https://github.com/Mithu2706/odoo](https://github.com/Mithu2706/odoo)

---

## Table of Contents
1. [Problem Statement](#problem-statement)
2. [Key Differentiators & Highlights](#key-differentiators--highlights)
3. [Architecture & Design](#architecture--design)
4. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
5. [Core Functional Modules](#core-functional-modules)
   - [Subscription Management](#1-subscription-management)
   - [Recurring Billing Engine](#2-recurring-billing-engine)
   - [Billing Assurance Center](#3-billing-assurance-center)
   - [Payments & Accounting](#4-payments--accounting)
   - [Executive Dashboard](#5-executive-dashboard)
   - [Customer Self-Service Portal](#6-customer-self-service-portal)
6. [Technology Stack](#technology-stack)
7. [Repository Structure](#repository-structure)
8. [Installation & Setup](#installation--setup)
   - [Prerequisites](#prerequisites)
   - [Backend Setup (FastAPI & SQLAlchemy)](#backend-setup)
   - [Database Migrations (Alembic)](#database-migrations)
   - [Frontend Setup (React & Vite)](#frontend-setup)
   - [Docker & PostgreSQL Setup](#docker--postgresql-setup)
9. [API Reference](#api-reference)
10. [Verification & Testing](#verification--testing)
11. [Step-by-Step Demonstration Workflow](#step-by-step-demonstration-workflow)
12. [Security, Concurrency & Data Isolation](#security-concurrency--data-isolation)
13. [Limitations & Roadmap](#limitations--roadmap)

---

## Problem Statement

Modern recurring-revenue businesses face major operational vulnerabilities:
1. **Silent Billing Failures**: Cron jobs and schedulers fail silently due to network timeouts, rate limits, or transient worker crashes, leaving customer cycles unbilled and leaking revenue unnoticed.
2. **Duplicate Invoices & Over-Billing**: Retried jobs or simultaneous webhook events generate duplicate invoices, damaging customer trust and creating accounting discrepancies.
3. **Opaque Calculation Logic**: Customers and accountants cannot trace how prorations, plan base fees, variant surcharges, and tax percentages combine into the final invoice total.
4. **Spreadsheet Reconciliation**: Finance teams manually compare bank/gateway payouts against CRM records to locate missing subscriptions and unpaid balances.

**Brightloop solves this** with an auditable **Billing Obligation Ledger**, an automated **Coverage Monitor**, mathematically verifiable **Calculation Receipts**, and an operational **Recovery Console**.

---

## Key Differentiators & Highlights

- **Deterministic Obligation Ledger**: Every subscription cycle generates an explicit `BillingObligation` record (`pending`, `processing`, `invoiced`, `failed`, `skipped`) backed by unique compound constraints (`subscription_id`, `period_start`, `period_end`) to enforce strict idempotency at the database level.
- **Billing Assurance Center**:
  - **Coverage Monitor**: Live visibility into expected vs. generated invoices, missing invoices, prevented duplicate attempts, delayed cycles, and upcoming obligations.
  - **Calculation Receipt**: On-demand itemized breakdown for any invoice showing base plan fees, variant surcharges, line-item quantities, subtotal, tax rounding, and mathematical validation (`subtotal + tax == total`).
  - **Recovery Console**: Pinpoints failed obligations with failure reasons, attempt counts, and one-click safe retry actions.
  - **Reliability Testing Center**: Interactive sandbox to simulate duplicate scheduler runs, simulated billing worker crashes, delayed invoice detection, and customer authorization barrier checks.
- **Enterprise RBAC & Workspace Isolation**: Multi-tenant workspace partitioning enforced at the database query layer for Admin, Staff, and Customer users.
- **Exact Decimal Financials**: All monetary operations use Python `Decimal` and SQL `NUMERIC(12, 2)` with half-up rounding to prevent floating-point drift.

---

## Architecture & Design

### System Architecture Flow

```mermaid
flowchart TD
    subgraph Client["Presentation Layer"]
        A["Admin / Staff Dashboard\n(React 19 + Radix UI)"]
        C["Customer Portal\n(Self-Service)"]
    end

    subgraph API["Application & Security Layer (FastAPI)"]
        AUTH["Auth & Session Guard\n(Argon2id + HttpOnly Cookie)"]
        RBAC["RBAC & Workspace Scoping\n(Admin / Staff / Customer)"]
        ROUTER["REST API Routes\n(/api/assurance, /api/subscriptions, etc.)"]
        ENGINE["Recurring Billing Engine\n(Idempotent Scheduler)"]
    end

    subgraph Core["Financial Core Engine"]
        CALC["Deterministic Calculation Engine\n(Decimal Precision, Tax, Variants)"]
        LEDGER["Billing Obligation Ledger\n(State Machine & Idempotency)"]
        AUDIT["Audit Logger\n(Transactional Action Logs)"]
    end

    subgraph Persistence["Database Layer (PostgreSQL / SQLite)"]
        DB[("SQL Database\nUnique Constraints\nRow Locks (SELECT FOR UPDATE)")]
    end

    Client --> AUTH
    AUTH --> RBAC
    RBAC --> ROUTER
    ROUTER --> ENGINE
    ENGINE --> LEDGER
    ENGINE --> CALC
    ENGINE --> AUDIT
    CALC --> DB
    LEDGER --> DB
    AUDIT --> DB
```

### Subscription Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> draft: Created
    draft --> quotation: Generate Quotation
    quotation --> confirmed: Customer / Staff Confirms
    confirmed --> active: Activate Subscription
    active --> paused: Customer / Staff Pauses
    paused --> active: Resume Subscription
    active --> closed: Cancel / Close Subscription
    paused --> closed: Cancel / Close Subscription
    closed --> [*]
```

---

## Role-Based Access Control (RBAC)

Access control is strictly validated in backend dependencies (`get_current_user`, `require_staff`, `require_admin`, and `own()` workspace scoping), not merely through frontend conditional rendering:

| Capability | Admin | Staff | Customer |
|---|:---:|:---:|:---:|
| View Organization Financials & MRR | Yes | Yes | No |
| Create / Manage Staff Accounts | Yes | No | No |
| Create / Edit Products & Pricing Variants | Yes | Yes | No |
| Configure Subscription Billing Plans | Yes | Yes | No |
| View All Workspace Subscriptions | Yes | Yes | Own Only |
| Create & Convert Quotations | Yes | Yes | No |
| Self-Service Subscribe to Public Plans | No | No | Yes |
| Pause / Resume / Cancel Subscriptions | Yes | Yes | Own Only |
| Generate Next Due / Scheduled Invoices | Yes | Yes | No |
| Record & Reconcile Payments | Yes | Yes | No |
| Access Billing Coverage Monitor | Yes | Yes | No |
| View Itemized Calculation Receipts | Yes | Yes | Own Invoices |
| Run Obligation Retries in Recovery Console | Yes | Yes | No |
| Execute Reliability Testing Scenarios | Yes | No | No |
| View System Audit Logs | Yes | No | No |

---

## Core Functional Modules

### 1. Subscription Management
- **Product & Variant Catalog**: Define products with recurring or usage models; add price-adjusting variants (e.g. storage tiers, regional add-ons).
- **Flexible Billing Plans**: Support daily, weekly, monthly, and yearly recurring intervals with custom base plan fees and minimum quantity constraints.
- **Calendar-Anchored Billing**: Month-end alignment (e.g., January 31st renews February 28th/29th and restores March 31st) prevents date drift across cycles.
- **Full Lifecycle Operations**: Transition states between `draft`, `quotation`, `confirmed`, `active`, `paused`, and `closed`.

### 2. Recurring Billing Engine
- **Obligation Generation**: Evaluates active subscriptions and creates missing `BillingObligation` cycles.
- **Idempotent Scheduler**: `POST /api/assurance/scheduler/run` processes pending due cycles within transactional locks. Repeated executions produce 0 duplicate invoices.
- **Missed Cycle Protection**: Catches up historical unbilled cycles sequentially rather than dropping or grouping them incorrectly.

### 3. Billing Assurance Center
- **Billing Coverage Monitor**: Live dashboard quantifying:
  - Total expected obligations
  - Invoiced cycles
  - Missing or skipped invoices
  - Prevented duplicate attempts
  - Delayed cycles (past due without invoice)
  - Active subscriptions pending future renewal
- **Calculation Receipt**: `GET /api/invoices/{id}/receipt` delivers an itemized audit statement displaying:
  - Base plan fee
  - Variant adjustments and line items
  - Quantities and line subtotals
  - Tax calculation and rounding method
  - Mathematical verification statement (`subtotal + tax = total`)
- **Recovery Console**: Identifies all failed billing obligations with error messages, attempt counts, and an authorized `POST /api/assurance/obligations/{id}/retry` action.
- **Reliability Testing Center**: Interactive sandbox for operators to trigger and observe:
  1. *Duplicate Scheduler Execution*: Validates zero duplicate invoices when fired twice simultaneously.
  2. *Simulated Billing Failure*: Verifies obligation transition to `failed` state and appearance in Recovery Console.
  3. *Delayed Invoice Detection*: Flags overdue unbilled obligations.
  4. *Customer Authorization Barrier*: Proves customer tokens cannot invoke privileged assurance endpoints (returns 403 Forbidden).

### 4. Payments & Accounting
- **Payment Recording**: Accept full and partial payments against confirmed invoices.
- **Overpayment Prevention**: Rejects payment amounts exceeding the invoice outstanding balance.
- **Clear Sandbox Workflow**: Explicitly labeled demo/manual payment recording without deceptive claims of live payment gateway execution.
- **Audit Logging**: Every financial action records timestamped actor details, IP, workspace, and entity identifiers.

### 5. Executive Dashboard
- **Real-Time KPIs**: Calculated directly from SQL aggregations:
  - Total Collected Revenue
  - Monthly Recurring Revenue (MRR)
  - Active, Paused, and Closed Subscriptions
  - Outstanding & Overdue Invoice Balances
  - Billing Coverage Percentage
- **Revenue & Cycle History**: Visual breakdown of collections over time.

### 6. Customer Self-Service Portal
- **Streamlined Portal UI**: Dedicated customer interface displaying only personal subscriptions, invoices, and receipts.
- **Plan Discovery & Subscription**: Customers can browse catalog plans and self-subscribe via `POST /api/subscriptions/subscribe`.
- **Self-Service Controls**: Pause, resume, or request cancellation of their active subscriptions.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Radix Themes, Lucide & Phosphor Icons |
| **Backend** | Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2.0 ORM |
| **Database** | PostgreSQL 16 (Production / Docker), SQLite (Local Dev & Unit Tests) |
| **Migrations** | Alembic (Version-controlled schema migrations) |
| **Testing** | pytest, FastAPI TestClient, Playwright |
| **Security** | Argon2id password hashing, HttpOnly SameSite Lax session cookies |

---

## Repository Structure

```
odoo/
├── backend/
│   ├── alembic.ini                   # Alembic database configuration
│   ├── Dockerfile                    # Container definition for FastAPI backend
│   ├── requirements.lock.txt         # Pinned production Python dependencies
│   ├── app/
│   │   ├── __init__.py
│   │   ├── bootstrap.py              # Interactive root admin bootstrap CLI
│   │   ├── main.py                   # FastAPI app, API routes, RBAC & billing engine
│   │   ├── models.py                 # SQLAlchemy models (Subscriptions, Invoices, Obligations, AuditLog)
│   │   └── security.py               # Argon2 password hashing & session management
│   ├── migrations/
│   │   ├── env.py                    # Alembic environment runner
│   │   └── versions/
│   │       ├── 001_initial_schema.py # Base entities (Users, Products, Plans, Invoices)
│   │       ├── 002_billing_obligations.py # BillingObligation ledger table
│   │       └── 003_audit_logs.py     # AuditLog transactional ledger
│   └── tests/
│       ├── conftest.py               # Test client fixtures & in-memory SQLite setup
│       ├── test_assurance.py         # Billing assurance, recovery & receipt tests
│       ├── test_migrations.py        # Alembic schema round-trip test
│       └── test_workflow.py          # End-to-end financial & RBAC integration tests
├── frontend/
│   ├── package.json                  # Frontend dependencies and scripts
│   ├── vite.config.ts                # Vite dev server and API proxy configuration
│   ├── index.html                    # Single-page application entry point
│   └── src/
│       ├── main.jsx                  # React application mount
│       ├── App.jsx                   # Main application UI, routing & navigation
│       ├── App.css                   # Component styles, modals & assurance widgets
│       └── api.js                    # Typed API client with error handling
├── docs/
│   ├── IMPLEMENTATION.md             # In-depth architectural & calculation notes
│   └── VERIFICATION.md               # Local verification logs & deployment gates
├── docker-compose.yml                # PostgreSQL 16 local service definition
└── README.md                         # Complete product documentation
```

---

## Installation & Setup

### Prerequisites
- **Git**
- **Python 3.10+** (Python 3.11 recommended)
- **Node.js 20+** and **npm**
- **Docker** (optional, for local PostgreSQL)

---

### Backend Setup

1. **Clone the repository and initialize Python virtual environment**:
   ```powershell
   git clone https://github.com/Mithu2706/odoo.git
   cd odoo
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r backend\requirements.lock.txt
   ```

2. **Configure environment variables**:
   ```powershell
   $env:SECRET_KEY = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
   $env:DATABASE_URL = "sqlite:///./brightloop.db"
   $env:DEMO_ENABLED = "true"
   $env:CORS_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
   ```

3. **Apply database migrations**:
   ```powershell
   cd backend
   python -m alembic upgrade head
   ```

4. **Launch the FastAPI backend server**:
   ```powershell
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   The backend API will be available at `http://127.0.0.1:8000`.
   - Interactive Swagger API docs: `http://127.0.0.1:8000/docs`
   - Health check: `http://127.0.0.1:8000/api/health`

---

### Database Migrations

Brightloop manages all database schema revisions through Alembic:
```powershell
cd backend
# Run all pending migrations
python -m alembic upgrade head

# Rollback one migration
python -m alembic downgrade -1
```

---

### Frontend Setup

In a new terminal window:
```powershell
cd odoo\frontend
npm install
npm run dev
```
Open **`http://127.0.0.1:5173`** in your browser.

To create an optimized production build:
```powershell
cd odoo\frontend
npm run build
```

---

### Docker & PostgreSQL Setup

To run a production-identical PostgreSQL database locally:
```powershell
# Set database password
$env:POSTGRES_PASSWORD = "your_secure_password"

# Launch PostgreSQL 16 container
docker compose up -d db

# Point backend to PostgreSQL
$env:DATABASE_URL = "postgresql+psycopg://brightloop:your_secure_password@localhost:5432/brightloop"
cd backend
python -m alembic upgrade head
```

---

## API Reference

### Authentication & Access
- `POST /api/auth/register` — Register a new account and isolated workspace.
- `POST /api/auth/login` — Sign in and receive HttpOnly session cookie.
- `POST /api/auth/logout` — Invalidate current session.
- `GET  /api/auth/me` — Return current authenticated user and role.
- `POST /api/auth/demo` — Create a seeded workspace for `admin`, `staff`, or `customer`.

### Subscriptions & Catalog
- `GET    /api/records/products` — List catalog products.
- `POST   /api/records/products` — Create a new product.
- `GET    /api/records/plans` — List subscription plans.
- `POST   /api/records/plans` — Create a new recurring plan.
- `GET    /api/records/subscriptions` — List subscriptions (scoped to workspace/customer).
- `POST   /api/records/subscriptions` — Create a subscription quotation (Staff/Admin).
- `POST   /api/subscriptions/subscribe` — Self-service subscription creation (Customer).
- `PATCH  /api/subscriptions/{id}/status` — Transition subscription status (`quotation`, `confirmed`, `active`, `paused`, `closed`).
- `POST   /api/subscriptions/{id}/bill-now` — Immediately generate invoice for the next due cycle.

### Invoices, Receipts & Payments
- `GET    /api/records/invoices` — List generated invoices.
- `GET    /api/invoices/{id}/receipt` — Fetch itemized Calculation Receipt with math breakdown.
- `PATCH  /api/invoices/{id}/confirm` — Confirm a draft invoice.
- `POST   /api/records/payments` — Record full or partial payment against an invoice.
- `GET    /api/records/payments` — List payment history.

### Billing Assurance & Reliability
- `GET    /api/assurance/monitor` — Retrieve coverage statistics and ledger records.
- `POST   /api/assurance/scheduler/run` — Run idempotent billing scheduler across all due subscriptions.
- `POST   /api/assurance/obligations/{id}/retry` — Safely retry a failed billing obligation.
- `POST   /api/assurance/test-scenario` — Execute controlled reliability test scenarios (`scheduler_duplicate_execution`, `simulate_billing_failure`, `delayed_invoice_detection`, `unauthorized_customer_barrier`).

---

## Verification & Testing

### 1. Backend Automated Test Suite
From the `backend/` directory:
```powershell
python -m pytest -v
```

**Test Coverage Summary**:
- `test_billing_assurance_workflow` — Verifies obligation ledger creation, scheduler invoice generation, duplicate prevention, and retry mechanics.
- `test_assurance_customer_authorization` — Verifies strict 403 Forbidden responses when customer tokens attempt to access internal assurance controls.
- `test_assurance_workspace_isolation` — Ensures cross-tenant leakage is impossible between distinct workspaces.
- `test_customer_portal_and_subscription_lifecycle` — Verifies customer self-service subscription, pause, resume, and cancellation.
- `test_calculation_receipt_and_reliability_testing_center` — Verifies receipt mathematical integrity (`subtotal + tax == total`) and reliability test scenarios.
- `test_migration_round_trip` — Verifies Alembic schema upgrade head and downgrade round trip.
- `test_workflow.py` — Complete financial workflow suite (calendar anchors, price snapshotting, overpayment rejection, session expiration, duplicate emails).

### 2. Frontend Production Build Check
From the `frontend/` directory:
```powershell
npm run build
```
Builds client environment with 0 errors and produces optimized bundles in `dist/`.

---

## Step-by-Step Demonstration Workflow

Follow this 14-step walkthrough during live jury or hackathon evaluations:

1. **Access Live Demo**:
   - Open `http://localhost:5173`. Select **Admin Demo**. The application loads with pre-seeded data in an isolated temporary workspace.
2. **Review Organization Dashboard**:
   - Inspect MRR, Total Revenue, Active/Paused Subscription counts, and the **Billing Coverage Percentage**.
3. **Inspect Catalog & Pricing**:
   - Open **Products**. Notice product variants with price adjustments (e.g. Enterprise SLA, Storage Add-on).
   - Open **Plans**. Inspect daily, weekly, monthly, and yearly recurring plans with base fees and minimum quantities.
4. **Create a Subscription**:
   - Open **Subscriptions** > **New Subscription**. Select a customer, plan, product, and variant. The initial state is `draft`.
5. **Convert Quotation to Active**:
   - Move status to `quotation`, then `confirmed`, then `active`.
6. **Open Billing Assurance Center**:
   - Navigate to **Billing Assurance** in the sidebar.
   - Inspect the **Coverage Monitor**: notice tracked obligations, expected invoices, and upcoming cycles.
7. **Execute Recurring Billing**:
   - Click **Run Scheduler Now**. The engine claims all due obligations, computes itemized charges, and generates invoices.
8. **Demonstrate Duplicate Prevention (Idempotency)**:
   - Click **Run Scheduler Now** a second time.
   - Notice the result: `0 new invoices created`, `0 duplicates allowed`. Database constraints prevent over-billing.
9. **Inspect the Calculation Receipt**:
   - Navigate to **Invoices**, select any generated invoice, and click **View Calculation Receipt**.
   - Review the transparent breakdown: Base Plan Fee + Variant Adjustment + Quantity × Price + Tax = Final Total. Note the green "Reconciliation Verified" badge.
10. **Record a Payment**:
    - Click **Record Payment** on the invoice. Enter a partial payment amount. Notice the invoice status becomes `partial` with outstanding balance correctly calculated.
11. **Simulate a Controlled Billing Failure**:
    - In **Billing Assurance**, click the **Reliability Testing** sub-tab.
    - Click **Execute Scenario** under *Simulate Billing Failure*.
    - Observe the detailed scenario card: the system intentionally triggers a failed obligation and logs the root cause.
12. **Recover Failed Obligation**:
    - Switch to the **Recovery Console** sub-tab.
    - Locate the failed obligation. Click **Retry Obligation**.
    - The obligation is re-evaluated, invoiced, and marked recovered with audit history recorded.
13. **Switch to Customer Portal**:
    - Log out, then select **Customer Demo** on the landing page.
    - Observe the simplified, customer-tailored interface: customers only see their personal plans, invoices, and payment history.
14. **Customer Self-Service**:
    - The customer pauses their subscription. The status immediately updates to `paused`. Resume and cancellation operate symmetrically without administrative intervention.

---

## Security, Concurrency & Data Isolation

- **Argon2id Hashing**: Passwords hashed using Argon2id with recommended memory and time cost factors.
- **Session Security**: Session tokens are signed, randomized 256-bit secrets stored in `HttpOnly`, `SameSite=Lax` cookies to prevent XSS exfiltration.
- **Workspace Isolation**: Every entity belongs to a `workspace_id`. Queries strictly filter on the active user's workspace, preventing tenant-hopping.
- **SQL Injection Immunity**: All database interactions use SQLAlchemy 2.0 type-safe expressions with parameterized SQL.
- **Concurrency & Row Locking**: Concurrent financial transactions utilize PostgreSQL row-level locks (`with_for_update`) to prevent race conditions during invoice and payment creation.

---

## Limitations & Roadmap

- **Currency Support**: Currently standardized to INR (₹); multi-currency conversion with real-time FX rates is planned.
- **Payment Gateway Integration**: Built-in manual/sandbox payment workflow. Direct webhooks for Stripe and Razorpay are architected for seamless adapter plug-in.
- **Customer Self-Registration Linking**: Public sign-ups create a new isolated tenant; linking public accounts to pre-existing corporate customer accounts requires Admin invitation tokens.
- **Automated Webhook Dispatch**: Webhook emitter for external accounting platforms (e.g. QuickBooks, Xero) scheduled for next release.

---

*Brightloop — Subscription & Revenue Intelligence Platform.*
