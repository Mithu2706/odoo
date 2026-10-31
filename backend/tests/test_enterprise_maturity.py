import pytest
from decimal import Decimal
from app.models import Subscription, BillingObligation, Invoice, Payment, Plan, Product, Customer
from tests.test_workflow import client, demo, records


def test_revenue_leakage_analysis(client):
    demo(client, role="admin")

    # Run leakage analysis
    r = client.get("/api/assurance/leakage")
    assert r.status_code == 200
    data = r.json()

    assert "total_leakage_detected" in data
    assert "unbilled_cycles_count" in data
    assert "overdue_receivables_count" in data
    assert "issues" in data
    assert isinstance(data["issues"], list)

    for issue in data["issues"]:
        assert "id" in issue
        assert "type" in issue
        assert "severity" in issue
        assert issue["severity"] in ("critical", "high", "medium", "low")
        assert "expected_amount" in issue
        assert "actual_amount" in issue
        assert "difference" in issue
        assert "recommended_action" in issue
        assert "resolution_status" in issue
        assert Decimal(issue["difference"]) >= Decimal("0.00")

    # Verify Customer role barrier (403 Forbidden)
    demo(client, role="customer")
    r_cust = client.get("/api/assurance/leakage")
    assert r_cust.status_code == 403


def test_billing_reconciliation_ledger(client):
    demo(client, role="admin")

    # Run billing reconciliation
    r = client.get("/api/assurance/reconciliation")
    assert r.status_code == 200
    data = r.json()

    assert "total_obligations" in data
    assert "fully_reconciled_count" in data
    assert "pending_collection_count" in data
    assert "unfulfilled_count" in data
    assert "reconciliation_rate" in data
    assert "records" in data
    assert isinstance(data["records"], list)

    for rec in data["records"]:
        assert "obligation_id" in rec
        assert "reconciliation_status" in rec
        assert rec["reconciliation_status"] in (
            "fully_reconciled",
            "partially_reconciled",
            "pending_collection",
            "unfulfilled_obligation",
        )
        assert "delta_amount" in rec
        assert "explanation" in rec
        assert "traceable_action" in rec

    # Verify Customer role barrier
    demo(client, role="customer")
    r_cust = client.get("/api/assurance/reconciliation")
    assert r_cust.status_code == 403


def test_renewal_intelligence_cohorts(client):
    demo(client, role="admin")

    # Fetch renewal forecasting cohorts
    r = client.get("/api/analytics/renewals")
    assert r.status_code == 200
    data = r.json()

    assert "cohorts" in data
    cohorts = data["cohorts"]
    assert "within_7_days" in cohorts
    assert "within_30_days" in cohorts
    assert "within_60_days" in cohorts

    for key in ("within_7_days", "within_30_days", "within_60_days"):
        assert "count" in cohorts[key]
        assert "projected_value" in cohorts[key]
        assert Decimal(cohorts[key]["projected_value"]) >= Decimal("0.00")

    assert "pipeline" in data
    assert isinstance(data["pipeline"], list)
    for item in data["pipeline"]:
        assert "subscription_id" in item
        assert "renewal_date" in item
        assert "projected_value" in item
        assert "urgency" in item
        assert item["urgency"] in ("urgent", "upcoming", "pipeline")
        assert "recommended_action" in item

    # Verify Customer role barrier
    demo(client, role="customer")
    r_cust = client.get("/api/analytics/renewals")
    assert r_cust.status_code == 403


def test_financial_analytics_summary_gaap(client):
    demo(client, role="admin")

    # Fetch GAAP financial summary
    r = client.get("/api/analytics/summary")
    assert r.status_code == 200
    data = r.json()

    assert "mrr" in data
    assert "arr" in data
    assert "invoiced_revenue" in data
    assert "collected_cash" in data
    assert "outstanding_receivables" in data
    assert "churn_rate" in data
    assert "billing_success_rate" in data
    assert "definitions" in data

    # Verify definitions
    for defn in (
        "mrr",
        "arr",
        "invoiced_revenue",
        "collected_cash",
        "outstanding_receivables",
        "billing_success_rate",
    ):
        assert defn in data["definitions"]
        assert len(data["definitions"][defn]) > 10

    # Invoiced revenue >= collected cash or outstanding receivables consistent
    invoiced = Decimal(data["invoiced_revenue"])
    collected = Decimal(data["collected_cash"])
    receivables = Decimal(data["outstanding_receivables"])
    assert receivables == max(invoiced - collected, Decimal("0.00"))

    # Verify Customer role barrier
    demo(client, role="customer")
    r_cust = client.get("/api/analytics/summary")
    assert r_cust.status_code == 403
