"""Chiffrement AES-256-GCM avec clé dérivée par utilisateur.

Simule l'approche Cryptomator : le serveur ne peut pas lire les fichiers en clair
sans la phrase secrète de l'utilisateur (fournie au moment de l'upload/download).
La clé n'est JAMAIS stockée sur le serveur.
"""

from __future__ import annotations

import hashlib
import os
import secrets

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

PBKDF2_ITERATIONS = 480_000
KEY_SIZE = 32  # AES-256
NONCE_SIZE = 12  # GCM standard


def generate_salt() -> str:
    """Génère un sel hex sur 16 octets (128 bits), stocké par utilisateur."""
    return secrets.token_hex(16)


def derive_key(passphrase: str, salt_hex: str) -> bytes:
    """Dérive une clé AES-256 depuis la passphrase de l'utilisateur.

    PBKDF2-HMAC-SHA256 avec 480 000 itérations (recommandation OWASP 2023+).
    """
    salt = bytes.fromhex(salt_hex)
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=KEY_SIZE,
        salt=salt,
        iterations=PBKDF2_ITERATIONS,
    )
    return kdf.derive(passphrase.encode("utf-8"))


def encrypt_bytes(plaintext: bytes, key: bytes, associated_data: bytes | None = None) -> bytes:
    """Chiffre `plaintext` avec AES-256-GCM.

    Format de sortie (12 octets de nonce || ciphertext||tag). Le tag est inclus
    par AES-GCM à la fin du `ciphertext`.
    """
    if len(key) != KEY_SIZE:
        raise ValueError(f"Clé invalide : {len(key)} octets, attendu {KEY_SIZE}")
    nonce = os.urandom(NONCE_SIZE)
    aesgcm = AESGCM(key)
    ct = aesgcm.encrypt(nonce, plaintext, associated_data)
    return nonce + ct


def decrypt_bytes(blob: bytes, key: bytes, associated_data: bytes | None = None) -> bytes:
    """Déchiffre un blob produit par `encrypt_bytes`."""
    if len(blob) < NONCE_SIZE + 16:
        raise ValueError("Blob chiffré trop court")
    nonce, ct = blob[:NONCE_SIZE], blob[NONCE_SIZE:]
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ct, associated_data)


def sha256_hex(data: bytes) -> str:
    """SHA-256 en hex minuscules — l'empreinte unique d'un document."""
    return hashlib.sha256(data).hexdigest()
