"""Contrats locaux utilisés par les workflows V2 migrés depuis V1."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Account
from app.services import stats_cache


@pytest.fixture
def local_client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    previous = app.dependency_overrides.copy()
    app.dependency_overrides[get_db] = lambda: session
    stats_cache.invalidate()
    try:
        with TestClient(app) as client:
            yield client, session
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous)
        stats_cache.invalidate()
        session.close()
        engine.dispose()


def test_statement_preview_preserves_each_rows_date_and_signed_amount(local_client):
    client, session = local_client
    account = Account(name="Compte test", type="Courant", initial_balance=0, currency="EUR")
    session.add(account)
    session.commit()
    content = "Date;Libellé;Montant\n01/10/2026;Achat A;-12,34\n02/10/2026;Recette B;56,78\n".encode()
    response = client.post("/api/csv/analyze_heuristic", data={"account_id": account.id}, files={"file": ("releve.csv", content, "text/csv")})
    assert response.status_code == 200, response.text
    rows = response.json()["transactions"]
    assert [(row["date_operation"], row["amount"]) for row in rows] == [("2026-10-01", -12.34), ("2026-10-02", 56.78)]


def test_category_drilldown_filters_before_pagination(local_client):
    client, session = local_client
    account = Account(name="Compte test", type="Courant", initial_balance=0, currency="EUR")
    session.add(account)
    session.commit()
    for day, category in [(1, "Transport"), (2, "Courses"), (3, "Transport")]:
        response = client.post("/api/transactions/", json={"description": f"Achat {day}", "amount": 10.01, "date_operation": f"2026-10-0{day}", "type": "expense_var", "category": category, "from_account_id": account.id})
        assert response.status_code == 200, response.text
    response = client.get("/api/transactions/?category=Transport&skip=1&limit=1")
    assert response.status_code == 200
    assert [(row["description"], row["category"]) for row in response.json()] == [("Achat 1", "Transport")]
