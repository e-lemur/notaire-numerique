"""Fixtures communes aux tests backend."""

from __future__ import annotations

import os
import tempfile
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine

# Variables d'environnement pour tests isolés, DOIVENT être définies avant l'import de app.*
_TMP = tempfile.mkdtemp(prefix="notaire-test-")
os.environ.setdefault("DATABASE_URL", f"sqlite:///{_TMP}/test.db")
os.environ.setdefault("DATA_DIR", _TMP)
os.environ.setdefault("STORAGE_DIR", f"{_TMP}/storage")
os.environ.setdefault("JWT_SECRET", "test-secret-please-ignore")

from app import database  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def _fresh_db() -> Iterator[None]:
    """Recrée la base à chaque test pour garantir l'isolation."""
    database.engine = create_engine(
        os.environ["DATABASE_URL"], connect_args={"check_same_thread": False}
    )
    SQLModel.metadata.drop_all(database.engine)
    SQLModel.metadata.create_all(database.engine)
    yield


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def auth_token(client: TestClient) -> str:
    client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "password123", "role": "professional"},
    )
    resp = client.post(
        "/auth/login",
        data={"username": "test@example.com", "password": "password123"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]
