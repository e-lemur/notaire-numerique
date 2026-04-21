from __future__ import annotations

import hashlib
import io

from fastapi.testclient import TestClient


def test_vault_upload_then_verify(client: TestClient, auth_token: str) -> None:
    payload = b"Contenu de mon contrat confidentiel."
    h = hashlib.sha256(payload).hexdigest()

    resp = client.post(
        "/vault/upload",
        headers={"Authorization": f"Bearer {auth_token}"},
        files={"file": ("contrat.pdf", io.BytesIO(payload), "application/pdf")},
        data={
            "passphrase": "ma-super-passphrase",
            "document_type": "legal",
            "label": "Contrat X",
            "seal": "true",
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["document_hash"] == h
    assert body["seal"]["document_hash"] == h

    verify = client.post("/verify", json={"document_hash": h})
    assert verify.json()["exists"] is True
