import pytest
import os
from tests.test_workflow import client, demo


def test_ai_analyst_unconfigured(client):
    demo(client, role="admin")

    # Ensure no API key in environment
    old_key = os.environ.pop("GEMINI_API_KEY", None)
    old_oa = os.environ.pop("OPENAI_API_KEY", None)
    old_ai = os.environ.pop("AI_API_KEY", None)

    try:
        r = client.post("/api/ai/analyst", json={"query": "What is our current revenue?"})
        assert r.status_code == 200
        data = r.json()

        assert data["configured"] is False
        assert "AI Revenue Analyst requires an API key" in data["message"]
        assert data["answer"] is None
        assert "database_data" in data
        assert "revenue" in data["database_data"]
        assert "invoiced_revenue_inr" in data["database_data"]["revenue"]
        assert "billing_health" in data["database_data"]
        assert "anomaly_summary" in data
        assert isinstance(data["anomaly_summary"], list)
    finally:
        if old_key: os.environ["GEMINI_API_KEY"] = old_key
        if old_oa: os.environ["OPENAI_API_KEY"] = old_oa
        if old_ai: os.environ["AI_API_KEY"] = old_ai


def test_ai_analyst_customer_forbidden(client):
    demo(client, role="customer")
    r = client.post("/api/ai/analyst", json={"query": "What is our current revenue?"})
    assert r.status_code == 403


def test_ai_analyst_mock_llm(client, monkeypatch):
    demo(client, role="admin")

    monkeypatch.setenv("OPENAI_API_KEY", "sk-test-mock-key-12345")

    class MockResponse:
        status_code = 200
        def json(self):
            return {
                "choices": [
                    {
                        "message": {
                            "content": "Current MRR is verified from database records with 100% billing health."
                        }
                    }
                ]
            }

    import httpx
    monkeypatch.setattr(httpx, "post", lambda *args, **kwargs: MockResponse())

    r = client.post("/api/ai/analyst", json={"query": "Summarize our billing health."})
    assert r.status_code == 200
    data = r.json()

    assert data["configured"] is True
    assert data["provider"] == "openai"
    assert "Current MRR is verified" in data["answer"]
    assert "database_data" in data
