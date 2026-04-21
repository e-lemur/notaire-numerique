from __future__ import annotations

import pytest
from cryptography.exceptions import InvalidTag

from app.crypto import decrypt_bytes, derive_key, encrypt_bytes, generate_salt, sha256_hex


def test_encrypt_decrypt_roundtrip() -> None:
    salt = generate_salt()
    key = derive_key("mot-de-passe-tres-robuste", salt)
    data = b"Le contenu confidentiel de mon contrat."
    blob = encrypt_bytes(data, key, associated_data=b"ctx")
    assert blob != data
    assert decrypt_bytes(blob, key, associated_data=b"ctx") == data


def test_decrypt_fails_with_wrong_passphrase() -> None:
    salt = generate_salt()
    key_ok = derive_key("correct-passphrase", salt)
    key_bad = derive_key("wrong-passphrase", salt)
    blob = encrypt_bytes(b"secret", key_ok)
    with pytest.raises(InvalidTag):
        decrypt_bytes(blob, key_bad)


def test_sha256_hex_stable() -> None:
    assert sha256_hex(b"abc") == (
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    )
