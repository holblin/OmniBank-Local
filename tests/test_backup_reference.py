"""Validation locale des fixtures de sauvegarde, sans modifier les fichiers source."""
import csv
import io
import os
from decimal import Decimal
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Account, Transaction
from app.services import stats_cache


@pytest.fixture
def backup_sample_dir():
    directory = os.environ.get("OMNIBANK_BACKUP_SAMPLE_DIR")
    if not directory:
        pytest.skip("OMNIBANK_BACKUP_SAMPLE_DIR requis pour les fixtures externes")
    return Path(directory)


def _read_csv(path):
    raw = path.read_bytes()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("cp1252")
    return list(csv.DictReader(io.StringIO(text), delimiter=";"))


def _decimal(value):
    return Decimal(value.replace("€", "").replace("\u202f", "").replace(" ", "").replace(",", "."))


def test_backup_csv_round_trip_preserves_reconciled_balances_and_amounts(backup_sample_dir):
    initial = {}
    for filename in ["Comptes soldes initials.csv", "Livrets soldes initials.csv"]:
        for row in _read_csv(backup_sample_dir / filename):
            values = list(row.values())
            initial[values[0]] = _decimal(values[1])
    source = backup_sample_dir / "Bank Data Example to Import as is.csv"
    expected = initial.copy()
    for row in _read_csv(source):
        if not row.get("Date de rapprochement"):
            continue
        amount = abs(_decimal(row["Montant"]))
        if row["Depuis"] in expected:
            expected[row["Depuis"]] -= amount
        if row["Vers"] in expected:
            expected[row["Vers"]] += amount

    # Separate sessions permit an actual export/reimport comparison without
    # allowing the second import to silently skip records already in the DB.
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine)
    db = sessions()
    previous = app.dependency_overrides.copy()
    app.dependency_overrides[get_db] = lambda: db
    client = TestClient(app)
    try:
        for name, balance in initial.items():
            db.add(Account(name=name, type="Compte courant", initial_balance=float(balance), currency="EUR"))
        db.commit()
        response = client.post("/api/csv/import", files={"file": (source.name, source.read_bytes(), "text/csv")})
        assert response.status_code == 200, response.text
        stats_cache.invalidate()
        balances = {a["name"]: Decimal(str(a["balance"])) for a in client.get("/api/stats/accounts").json()}
        assert balances == expected
        # This figure is also present in the supplied reference image.
        assert balances["CA Centre-Est"] == Decimal("3942.28")

        def snapshot():
            accounts = {a.id: a.name for a in db.query(Account).all()}
            return sorted((
                t.csv_id, t.description, Decimal(str(t.amount)), t.date_operation,
                t.reconciliation_date, accounts.get(t.from_account_id), accounts.get(t.to_account_id),
            ) for t in db.query(Transaction).filter(Transaction.csv_id.isnot(None)).all())

        before = snapshot()
        assert len(before) == 2468
        exported = client.get("/api/csv/export")
        assert exported.status_code == 200
        db.close()
        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)
        db = sessions()
        for name, balance in initial.items():
            db.add(Account(name=name, type="Compte courant", initial_balance=float(balance), currency="EUR"))
        db.commit()
        response = client.post("/api/csv/import", files={"file": ("roundtrip.csv", exported.content, "text/csv")})
        assert response.status_code == 200, response.text
        assert snapshot() == before
        stats_cache.invalidate()
        balances = {a["name"]: Decimal(str(a["balance"])) for a in client.get("/api/stats/accounts").json()}
        assert balances == expected
    finally:
        client.close()
        db.close()
        engine.dispose()
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous)
        stats_cache.invalidate()
