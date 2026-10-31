import os
import pytest
from datetime import date, timedelta
from app.models import BillingObligation, Subscription
from sqlalchemy import select
from tests.test_workflow import client, demo, records


def test_billing_assurance_workflow(client):
    # 1. Setup Admin session via Demo
    demo(client, role="admin")

    # Verify initial obligations seeded with demo
    obs = records(client, "billing_obligations")
    assert len(obs) > 0, "Demo should seed billing obligations"
    
    # 2. Test Summary Endpoint
    summary_res = client.get("/api/assurance/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert "total_expected" in summary
    assert "successfully_invoiced" in summary
    assert "missing_invoices" in summary
    assert "delayed_invoices" in summary
    assert "failed_attempts" in summary
    assert "duplicates_prevented" in summary
    assert summary["total_expected"] >= len(obs)

    # 3. Create a new subscription and verify obligation creation
    c = client.post(
        "/api/customers",
        json={"name": "Assurance Customer", "email": "assurance@example.com", "company": "Assurance Ltd"},
    ).json()

    p = client.post(
        "/api/products",
        json={"name": "Assurance Plan Product", "sales_price": "50.00", "cost_price": "10.00"},
    ).json()

    plan = client.post(
        "/api/plans",
        json={"name": "Assurance Plan", "interval": "monthly", "price": "10.00", "minimum_quantity": 1},
    ).json()

    start_today = date.today()
    sub = client.post(
        "/api/subscriptions",
        json={
            "customer_id": c["id"],
            "plan_id": plan["id"],
            "start_date": str(start_today),
            "tax_percent": "10.00",
            "items": [{"product_id": p["id"], "quantity": 1}],
        },
    ).json()

    # Move subscription to active
    client.patch("/api/subscriptions/" + sub["id"] + "/status", json={"status": "quotation"})
    client.patch("/api/subscriptions/" + sub["id"] + "/status", json={"status": "confirmed"})
    active_res = client.patch("/api/subscriptions/" + sub["id"] + "/status", json={"status": "active"})
    assert active_res.status_code == 200

    # Verify obligations created for active subscription
    sub_obs = [x for x in records(client, "billing_obligations") if x["subscription_id"] == sub["id"]]
    assert len(sub_obs) >= 1, "Expected obligation to be created for active subscription"

    # Count invoices before scheduler
    invs_before = len(records(client, "invoices"))

    # 4. Run Scheduler to generate invoice from due obligation
    run_res = client.post("/api/assurance/scheduler/run")
    assert run_res.status_code == 200
    res_data = run_res.json()
    assert res_data["invoiced"] >= 1, "Scheduler should generate at least 1 invoice"
    invs_after = len(records(client, "invoices"))
    assert invs_after > invs_before

    # 5. Run Scheduler TWICE: Idempotency check, no duplicates created
    run_res_2 = client.post("/api/assurance/scheduler/run")
    assert run_res_2.status_code == 200
    res_data_2 = run_res_2.json()
    assert res_data_2["invoiced"] == 0, "Second scheduler run should not create duplicate invoices"
    assert len(records(client, "invoices")) == invs_after, "Invoice count should not increase on re-run"

    # 6. Test Handling Failed Obligation & Retry Action
    all_obs = records(client, "billing_obligations")
    invoiced_ob = next((x for x in all_obs if x["status"] == "invoiced"), None)
    assert invoiced_ob is not None
    assert invoiced_ob["invoice_id"] is not None

    # Verify duplicate prevention: Uniqueness constraint on (subscription_id, period_start, period_end)
    from sqlalchemy.exc import IntegrityError
    from sqlalchemy.orm import Session
    with Session(client.test_engine) as session:
        dup = BillingObligation(
            workspace_id=invoiced_ob["workspace_id"],
            subscription_id=invoiced_ob["subscription_id"],
            period_start=date.fromisoformat(invoiced_ob["period_start"]),
            period_end=date.fromisoformat(invoiced_ob["period_end"]),
            due_date=date.fromisoformat(invoiced_ob["due_date"]),
            status="pending",
        )
        session.add(dup)
        with pytest.raises(IntegrityError):
            session.commit()
        session.rollback()

    # 7. Create a simulated failed obligation to test retry
    with Session(client.test_engine) as session:
        failed_ob = BillingObligation(
            workspace_id=invoiced_ob["workspace_id"],
            subscription_id=sub["id"],
            period_start=date.today() - timedelta(days=5),
            period_end=date.today() + timedelta(days=25),
            due_date=date.today() - timedelta(days=5),
            status="failed",
            attempt_count=1,
            last_error="Simulated network failure during gateway communication",
        )
        session.add(failed_ob)
        session.commit()
        failed_id = failed_ob.id

    # Verify failed obligation in records
    failed_record = next(x for x in records(client, "billing_obligations") if x["id"] == failed_id)
    assert failed_record["status"] == "failed"
    assert "network failure" in failed_record["last_error"]

    # Test retry action
    retry_res = client.post(f"/api/assurance/obligations/{failed_id}/retry")
    # Even if cycle_date does not match sub.next_billing, retry records attempt and error safely without crashing
    assert retry_res.status_code in (200, 409)
    # Check that attempt_count incremented
    with Session(client.test_engine) as session:
        refreshed = session.get(BillingObligation, failed_id)
        assert refreshed.attempt_count >= 2, "Retry must increment attempt_count"


def test_assurance_customer_authorization(client):
    # Customer should not be able to access billing assurance endpoints
    demo(client, role="customer")

    # 1. Summary endpoint should be 403
    r = client.get("/api/assurance/summary")
    assert r.status_code == 403

    # 2. Records endpoint for billing_obligations should be 403
    r = client.get("/api/records/billing_obligations")
    assert r.status_code == 403

    # 3. Scheduler trigger should be 403
    r = client.post("/api/assurance/scheduler/run")
    assert r.status_code == 403

    # 4. Retry obligation should be 403
    r = client.post("/api/assurance/obligations/some-id/retry")
    assert r.status_code == 403


def test_assurance_workspace_isolation(client):
    # Admin in workspace 1
    demo(client, role="admin")
    obs_1 = records(client, "billing_obligations")
    assert len(obs_1) > 0
    ob_id = obs_1[0]["id"]

    # Login as Admin in new workspace 2 (calling demo creates a new isolated workspace)
    demo(client, role="admin")
    obs_2 = records(client, "billing_obligations")
    # Verify IDs from workspace 1 do not appear in workspace 2
    obs_2_ids = {x["id"] for x in obs_2}
    assert ob_id not in obs_2_ids

    # Trying to retry an obligation from another workspace should 404
    r = client.post(f"/api/assurance/obligations/{ob_id}/retry")
    assert r.status_code == 404
