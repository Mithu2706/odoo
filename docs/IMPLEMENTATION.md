# Phase 1 implementation plan and boundaries

Brightloop replaces spreadsheet tracking with a database-backed subscription-to-payment workflow. The first milestone focuses on reliable billing and visible revenue rather than predictive features.

## Architecture

- React, Vite and TypeScript frontend; Tailwind v4 and Radix Themes for accessible dialogs.
- FastAPI API with Pydantic input validation, SQLAlchemy data access and Alembic migrations.
- PostgreSQL production database. SQLite supports quick local evaluation and automated functional tests.
- HttpOnly cookie authentication, Argon2 password hashing, signed eight-hour sessions, backend role checks and workspace/customer filtering.
- Production frontend proxies `/api` to the backend so cookies remain first party.

## Data model

Workspaces isolate production accounts and disposable demos. Users belong to a workspace and may reference a customer. Products have variants; plans define cycle and a base fee. Subscriptions reference customer and plan and snapshot their product lines, interval and prices. Invoices snapshot billed lines. Payments reference invoices. Invoice cycles and payment request identifiers have unique constraints.

Financial writes use one SQLAlchemy transaction; PostgreSQL row locks serialize concurrent billing/payment requests. Invoice amounts use `Decimal` and `NUMERIC`, with half-up rounding to two decimal places. Subscription billing dates preserve their original day through short months. Times are UTC; billing operates on calendar dates.

## Order of work

1. Inspect and clone the official repository.
2. Build schema, migration and authentication.
3. Add catalog, customer and plan endpoints.
4. Implement subscription lifecycle and price snapshots.
5. Implement invoice cycles, confirmation, partial payments and full settlement.
6. Build landing, role-aware app, dashboards and isolated demos.
7. Test financial workflows, authorization and tenant isolation; build frontend.
8. Document setup/deployment, review secrets, commit locally. Obtain user confirmation before push or deployment.

## Current scope

Implemented in source: login/registration/logout, Admin/Staff/Customer permissions, admin-only staff and customer-portal provisioning API, customer creation/listing, products with editing/archive and variant creation, plan creation/editing, subscription creation and lifecycle, manual next-due-cycle invoice generation, idempotent invoice requests, invoice confirmation and printing, partial/full payment recording, dashboard aggregates, overdue visibility, upcoming billing and per-entry isolated demos.

Frontend subscription creation accepts one product line; the API supports multiple lines. Records use 50-row pagination; selectors load up to 200 records. Search filters the current page. Amounts are INR only. The plan fee is added once per cycle to quantity × product/variant prices, then subscription tax is applied. Staff may set subscription tax; full admin-managed tax rules are outside Phase 1.

Customer account registration creates an isolated customer workspace. For access to existing business records, an administrator must use `/api/customers/{id}/account` with that record's email. This deliberately avoids linking an unverified public registration to financial records by email alone.

Not implemented: email password reset, email sending, invoice cancellation, automatic scheduled billing, quotation templates/validity, discounts/tax-rule modules, pause/proration/automatic closure rules, reminder delivery, online payment processing, demo cleanup scheduling and predictive intelligence. Upcoming billing and overdue visibility do not send notifications. Demo role switching creates a fresh dataset; it does not preserve changes between perspectives. Demo workspaces expire after eight hours but require an operational cleanup policy.

## Verification strategy

API tests cover registration, duplicates, password policy, login, role authorization, staff creation, customer/tenant isolation, product create/edit, variants, plans, minimum quantities, subscription transitions, decimal invoice calculations, duplicate invoices, future-cycle rejection, confirmation, partial/full payment, idempotency, overpayment, dashboard changes, origin checks and calendar anchors. Browser QA should cover demo entry and the subscription-to-payment path on desktop/mobile. PostgreSQL concurrency and scale tests are separate deployment gates; SQLite tests do not establish those properties.
