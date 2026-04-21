from __future__ import annotations

import hashlib

from fastapi.testclient import TestClient


def _hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def test_seal_and_verify_roundtrip(client: TestClient, auth_token: str) -> None:
    h = _hex(b"hello world")
    resp = client.post(
        "/seal",
        json={"document_hash": h, "document_type": "legal", "label": "Contrat X"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 200, resp.text
    seal = resp.json()
    assert seal["document_hash"] == h
    assert seal["chain_index"] == 0
    assert seal["previous_chain_hash"] == "0" * 64

    # Vérification publique (non authentifiée)
    resp = client.post("/verify", json={"document_hash": h})
    assert resp.status_code == 200
    body = resp.json()
    assert body["exists"] is True
    assert body["chain_valid"] is True
    assert body["seal"]["document_hash"] == h


def test_verify_unknown_hash(client: TestClient) -> None:
    resp = client.post("/verify", json={"document_hash": "a" * 64})
    assert resp.status_code == 200
    assert resp.json()["exists"] is False


def test_hash_chain_sequences(client: TestClient, auth_token: str) -> None:
    headers = {"Authorization": f"Bearer {auth_token}"}
    h1 = _hex(b"first")
    h2 = _hex(b"second")
    h3 = _hex(b"third")

    s1 = client.post("/seal", json={"document_hash": h1}, headers=headers).json()
    s2 = client.post("/seal", json={"document_hash": h2}, headers=headers).json()
    s3 = client.post("/seal", json={"document_hash": h3}, headers=headers).json()

    assert s1["chain_index"] == 0
    assert s2["chain_index"] == 1
    assert s3["chain_index"] == 2
    assert s2["previous_chain_hash"] == s1["chain_hash"]
    assert s3["previous_chain_hash"] == s2["chain_hash"]


def test_invalid_hash_rejected(client: TestClient, auth_token: str) -> None:
    resp = client.post(
        "/seal",
        json={"document_hash": "not-a-hash"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert resp.status_code == 422


def test_seal_requires_auth(client: TestClient) -> None:
    resp = client.post("/seal", json={"document_hash": "a" * 64})
    assert resp.status_code == 401


def test_certificate_pdf(client: TestClient, auth_token: str) -> None:
    headers = {"Authorization": f"Bearer {auth_token}"}
    h = _hex(b"pdf-me")
    seal = client.post("/seal", json={"document_hash": h}, headers=headers).json()
    resp = client.get(f"/certificate/{seal['seal_id']}", headers=headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content.startswith(b"%PDF")


def test_certificate_contains_qr_and_verify_url(client: TestClient, auth_token: str) -> None:
    """Le PDF doit contenir le QR code (image XObject) et l'URL de
    vérification avec le hash scellé — vérifié via pypdf pour éviter
    les faux négatifs dus à la compression ReportLab."""
    import io as _io

    from pypdf import PdfReader

    headers = {"Authorization": f"Bearer {auth_token}"}
    h = _hex(b"qr-me")
    seal = client.post("/seal", json={"document_hash": h}, headers=headers).json()
    resp = client.get(f"/certificate/{seal['seal_id']}", headers=headers)
    assert resp.status_code == 200

    reader = PdfReader(_io.BytesIO(resp.content))
    page = reader.pages[0]
    text = page.extract_text() or ""
    # Le hash figure à la fois dans la table et dans l'URL du QR code
    assert h in text
    assert "http" in text  # URL de vérification présente
    # Au moins une image embarquée (le QR code)
    images = list(page.images)
    assert len(images) >= 1


def test_certificate_requires_owner(client: TestClient, auth_token: str) -> None:
    headers = {"Authorization": f"Bearer {auth_token}"}
    h = _hex(b"other-owner")
    seal = client.post("/seal", json={"document_hash": h}, headers=headers).json()

    # Deuxième utilisateur
    client.post(
        "/auth/register",
        json={"email": "other@u.com", "password": "password123"},
    )
    tok2 = client.post(
        "/auth/login", data={"username": "other@u.com", "password": "password123"}
    ).json()["access_token"]
    resp = client.get(
        f"/certificate/{seal['seal_id']}", headers={"Authorization": f"Bearer {tok2}"}
    )
    assert resp.status_code == 403
