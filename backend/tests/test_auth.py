from __future__ import annotations

from fastapi.testclient import TestClient


def test_register_and_login(client: TestClient) -> None:
    resp = client.post(
        "/auth/register",
        json={"email": "a@b.com", "password": "password123", "role": "professional"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["email"] == "a@b.com"
    assert body["role"] == "professional"

    resp = client.post(
        "/auth/login", data={"username": "a@b.com", "password": "password123"}
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    assert token

    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "a@b.com"


def test_duplicate_email_rejected(client: TestClient) -> None:
    payload = {"email": "dup@b.com", "password": "password123"}
    assert client.post("/auth/register", json=payload).status_code == 200
    assert client.post("/auth/register", json=payload).status_code == 409


def test_login_wrong_password(client: TestClient) -> None:
    client.post(
        "/auth/register",
        json={"email": "x@y.com", "password": "password123"},
    )
    resp = client.post(
        "/auth/login", data={"username": "x@y.com", "password": "wrongpw123"}
    )
    assert resp.status_code == 401


def test_me_requires_auth(client: TestClient) -> None:
    assert client.get("/auth/me").status_code == 401
