import os

os.environ["SECRET_KEY"] = "test-secret-value-that-is-at-least-32-characters"
os.environ["DEMO_ENABLED"] = "true"
os.environ["DATABASE_URL"] = "sqlite://"
from datetime import date
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from app.main import app, db, next_cycle
from app.models import Base, User


@pytest.fixture
def client():
    url = os.getenv("TEST_DATABASE_URL", "sqlite://")
    engine = create_engine(
        url,
        **(
            {"connect_args": {"check_same_thread": False}, "poolclass": StaticPool}
            if url.startswith("sqlite")
            else {}
        ),
    )
    Base.metadata.create_all(engine)

    def session():
        with Session(engine) as s:
            yield s

    app.dependency_overrides[db] = session
    with TestClient(app) as c:
        c.test_engine = engine
        yield c
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)
    engine.dispose()


def demo(c, role="admin"):
    r = c.post("/api/auth/demo", json={"role": role})
    assert r.status_code == 200, r.text
    return r.json()


def records(c, kind):
    r = c.get("/api/records/" + kind)
    assert r.status_code == 200, r.text
    return r.json()


def test_registration_login_password_duplicate(client):
    data = {
        "name": "Test Customer",
        "email": "TEST@example.com",
        "password": "StrongPass!9",
    }
    bad = client.post("/api/auth/register", json={**data, "password": "weakpass1"})
    assert bad.status_code == 422
    assert client.post("/api/auth/register", json=data).status_code == 201
    assert client.get("/api/auth/me").json()["role"] == "customer"
    assert client.post("/api/auth/register", json=data).status_code == 409
    client.post("/api/auth/logout")
    assert client.get("/api/auth/me").status_code == 401
    assert (
        client.post(
            "/api/auth/login", json={"email": data["email"], "password": "wrong"}
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/api/auth/login",
            json={"email": data["email"], "password": data["password"]},
        ).status_code
        == 200
    )


def test_financial_workflow(client):
    demo(client)
    c = client.post(
        "/api/customers",
        json={"name": "New Customer", "email": "new@example.com", "company": "New Co"},
    ).json()
    p = client.post(
        "/api/products",
        json={"name": "Analytics", "sales_price": "100.10", "cost_price": "20.00"},
    )
    assert p.status_code == 201
    p = p.json()
    edited = client.patch(
        "/api/products/" + p["id"],
        json={"name": "Analytics Plus", "sales_price": "110.10", "cost_price": "20.00"},
    )
    assert edited.status_code == 200
    v = client.post(
        "/api/products/" + p["id"] + "/variants",
        json={"name": "Odoo", "adjustment": "560.00"},
    ).json()
    plan = client.post(
        "/api/plans",
        json={
            "name": "Weekly",
            "interval": "weekly",
            "price": "5.50",
            "minimum_quantity": 2,
        },
    )
    assert plan.status_code == 201
    plan = plan.json()
    payload = {
        "customer_id": c["id"],
        "plan_id": plan["id"],
        "start_date": str(date.today()),
        "tax_percent": "18",
        "items": [{"product_id": p["id"], "variant_id": v["id"], "quantity": 2}],
    }
    bad = {**payload, "items": [{"product_id": p["id"], "quantity": 1}]}
    assert client.post("/api/subscriptions", json=bad).status_code == 422
    sub = client.post("/api/subscriptions", json=payload)
    assert sub.status_code == 201, sub.text
    sub = sub.json()
    ident = sub["id"]
    assert (
        client.patch(
            "/api/subscriptions/" + ident + "/status", json={"status": "active"}
        ).status_code
        == 409
    )
    for status in ["quotation", "confirmed", "active"]:
        assert (
            client.patch(
                "/api/subscriptions/" + ident + "/status", json={"status": status}
            ).status_code
            == 200
        )
    invoice = client.post(
        "/api/subscriptions/" + ident + "/invoices",
        json={"cycle_date": str(date.today())},
    )
    assert invoice.status_code == 200, invoice.text
    invoice = invoice.json()
    assert Decimal(invoice["subtotal"]) == Decimal("1345.70")
    assert Decimal(invoice["tax"]) == Decimal("242.23")
    assert Decimal(invoice["total"]) == Decimal("1587.93")
    repeated = client.post(
        "/api/subscriptions/" + ident + "/invoices",
        json={"cycle_date": str(date.today())},
    ).json()
    assert repeated["id"] == invoice["id"]
    next_sub = next(x for x in records(client, "subscriptions") if x["id"] == ident)
    assert (
        client.post(
            "/api/subscriptions/" + ident + "/invoices",
            json={"cycle_date": next_sub["next_billing"]},
        ).status_code
        == 409
    )
    payment = {
        "amount": "1587.93",
        "method": "bank_transfer",
        "date": str(date.today()),
        "notes": "Test",
        "idempotency_key": "test-payment-0001",
    }
    assert (
        client.post(
            "/api/invoices/" + invoice["id"] + "/payments", json=payment
        ).status_code
        == 409
    )
    assert client.post("/api/invoices/" + invoice["id"] + "/confirm").status_code == 200
    assert (
        client.post(
            "/api/invoices/" + invoice["id"] + "/payments",
            json={**payment, "amount": "99999"},
        ).status_code
        == 422
    )
    before = client.get("/api/dashboard").json()
    assert (
        client.post(
            "/api/invoices/" + invoice["id"] + "/payments",
            json={**payment, "amount": "500.00"},
        ).status_code
        == 201
    )
    assert (
        client.post(
            "/api/invoices/" + invoice["id"] + "/payments",
            json={**payment, "amount": "500.00"},
        ).status_code
        == 201
    )
    assert (
        client.post(
            "/api/invoices/" + invoice["id"] + "/payments",
            json={
                **payment,
                "amount": "1087.93",
                "idempotency_key": "test-payment-0002",
            },
        ).status_code
        == 201
    )
    result = next(x for x in records(client, "invoices") if x["id"] == invoice["id"])
    assert result["status"] == "paid" and Decimal(result["balance"]) == 0
    after = client.get("/api/dashboard").json()
    assert Decimal(after["collected"]) - Decimal(before["collected"]) == Decimal(
        "1587.93"
    )
    assert Decimal(before["outstanding"]) - Decimal(after["outstanding"]) == Decimal(
        "1587.93"
    )


def test_rbac_staff_creation_and_customer_isolation(client):
    admin = demo(client)
    inv = records(client, "invoices")[0]
    staff = {
        "name": "Staff Member",
        "email": "staff@example.com",
        "password": "StaffPass!9",
    }
    assert client.post("/api/staff", json=staff).status_code == 201
    assert (
        client.post(
            "/api/auth/login",
            json={"email": staff["email"], "password": staff["password"]},
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/staff", json={**staff, "email": "another@example.com"}
        ).status_code
        == 403
    )
    assert (
        client.post(
            "/api/products", json={"name": "Allowed", "sales_price": "20"}
        ).status_code
        == 201
    )
    customer = demo(client, "customer")
    subs = records(client, "subscriptions")
    invoices = records(client, "invoices")
    assert len(subs) == 1 and len(invoices) == 1
    assert all(x["customer_id"] == customer["customer_id"] for x in subs + invoices)
    assert (
        client.post(
            "/api/products", json={"name": "Forbidden", "sales_price": "20"}
        ).status_code
        == 403
    )
    assert client.post("/api/invoices/" + inv["id"] + "/confirm").status_code == 403
    assert "cost_price" not in records(client, "products")[0]
    # A second customer in the SAME workspace cannot see the first customer's records.
    with Session(client.test_engine) as s:
        u = s.get(User, customer["id"])
        u.customer_id = admin["customer_id"]  # null customer association
        s.commit()
    assert records(client, "subscriptions") == []
    assert records(client, "invoices") == []


def test_workspace_isolation_and_origin(client):
    demo(client)
    p = records(client, "products")[0]
    demo(client)
    assert (
        client.patch(
            "/api/products/" + p["id"], json={"name": "Stolen", "sales_price": "1"}
        ).status_code
        == 404
    )
    assert (
        client.post(
            "/api/auth/demo",
            json={"role": "admin"},
            headers={"origin": "https://evil.example"},
        ).status_code
        == 403
    )


def test_calendar_anchor():
    assert next_cycle(date(2026, 1, 31), "monthly", 31) == date(2026, 2, 28)
    assert next_cycle(date(2026, 2, 28), "monthly", 31) == date(2026, 3, 31)
    assert next_cycle(date(2024, 2, 29), "yearly", 29) == date(2025, 2, 28)


def test_customer_portal_same_workspace(client):
    demo(client)
    customers = records(client, "customers")
    for i, c in enumerate(customers[:2]):
        account = {"name": c["name"], "email": c["email"], "password": "CustomerPass!9"}
        assert (
            client.post(
                "/api/customers/" + c["id"] + "/account", json=account
            ).status_code
            == 201
        )
    for c in customers[:2]:
        assert (
            client.post(
                "/api/auth/login",
                json={"email": c["email"], "password": "CustomerPass!9"},
            ).status_code
            == 200
        )
        assert all(
            x["customer_id"] == c["id"] for x in records(client, "subscriptions")
        )
        assert all(x["customer_id"] == c["id"] for x in records(client, "invoices"))
        assert len(records(client, "subscriptions")) == 1
        assert len(records(client, "customers")) == 1


def test_price_snapshot_and_input_validation(client):
    demo(client)
    c = records(client, "customers")[0]
    p = records(client, "products")[0]
    plan = records(client, "plans")[0]
    payload = {
        "customer_id": c["id"],
        "plan_id": plan["id"],
        "start_date": str(date.today()),
        "items": [{"product_id": p["id"], "quantity": 5, "unit_price": "0.01"}],
    }
    sub = client.post("/api/subscriptions", json=payload).json()
    assert (
        client.patch(
            "/api/products/" + p["id"], json={"name": p["name"], "sales_price": "9999"}
        ).status_code
        == 200
    )
    saved = next(x for x in records(client, "subscriptions") if x["id"] == sub["id"])
    assert Decimal(saved["items"][0]["unit_price"]) == Decimal(p["sales_price"])
    assert (
        client.post(
            "/api/products", json={"name": "Invalid", "sales_price": "-1"}
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/plans",
            json={
                "name": "Invalid",
                "interval": "monthly",
                "price": "1",
                "available_from": "2026-12-31",
                "available_until": "2026-01-01",
            },
        ).status_code
        == 422
    )


def test_session_expiry_tampering_and_database_roles(client):
    import jwt
    from datetime import datetime, timezone, timedelta

    response = client.post("/api/auth/demo", json={"role": "customer"})
    assert response.status_code == 200
    user = response.json()
    assert "httponly" in response.headers["set-cookie"].lower()
    payload = {
        "sub": user["id"],
        "role": "admin",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    client.cookies.clear()
    client.cookies.set(
        "session", jwt.encode(payload, os.environ["SECRET_KEY"], algorithm="HS256")
    )
    assert (
        client.post(
            "/api/products", json={"name": "Forged Role", "sales_price": "10"}
        ).status_code
        == 403
    )
    client.cookies.clear()
    client.cookies.set(
        "session",
        jwt.encode(
            payload, "a-different-secret-of-at-least-32-characters", algorithm="HS256"
        ),
    )
    assert client.get("/api/auth/me").status_code == 401
    client.cookies.clear()
    payload["exp"] = datetime.now(timezone.utc) - timedelta(seconds=1)
    client.cookies.set(
        "session", jwt.encode(payload, os.environ["SECRET_KEY"], algorithm="HS256")
    )
    assert client.get("/api/auth/me").status_code == 401


@pytest.mark.skipif(
    not os.getenv("TEST_DATABASE_URL", "").startswith("postgresql"),
    reason="Requires isolated PostgreSQL TEST_DATABASE_URL; SQLite does not implement row locks",
)
def test_postgresql_concurrent_invoice_and_payment(client):
    from concurrent.futures import ThreadPoolExecutor

    demo(client)
    sub = next(
        x
        for x in records(client, "subscriptions")
        if x["next_billing"] <= str(date.today())
    )

    def bill(_):
        return client.post(
            "/api/subscriptions/" + sub["id"] + "/invoices",
            json={"cycle_date": sub["next_billing"]},
        )

    with ThreadPoolExecutor(max_workers=2) as pool:
        invoices = list(pool.map(bill, range(2)))
    assert all(x.status_code == 200 for x in invoices)
    assert invoices[0].json()["id"] == invoices[1].json()["id"]
    inv = invoices[0].json()
    assert client.post("/api/invoices/" + inv["id"] + "/confirm").status_code == 200

    def payment(i):
        return client.post(
            "/api/invoices/" + inv["id"] + "/payments",
            json={
                "amount": inv["total"],
                "method": "cash",
                "date": str(date.today()),
                "idempotency_key": "parallel-payment-" + str(i),
            },
        )

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(payment, range(2)))
    assert sorted(x.status_code for x in results) == [201, 409]
