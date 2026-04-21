"""Modèles de données (SQLModel + Pydantic)."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, EmailStr, Field
from sqlmodel import Field as SQLField
from sqlmodel import SQLModel


class Role(StrEnum):
    """Rôle métier. L'avocat/notaire/médecin a un rôle `professional`."""

    professional = "professional"
    client = "client"


class DocumentType(StrEnum):
    """Type de document scellé.

    Ces catégories permettent de tracer la nature des preuves sans jamais
    révéler le contenu. Elles n'affectent pas la cryptographie, seulement
    l'UX et les statistiques.
    """

    legal = "legal"
    medical = "medical"
    other = "other"


# ---------- Tables SQL ----------


class User(SQLModel, table=True):
    """Utilisateur de la plateforme."""

    id: int | None = SQLField(default=None, primary_key=True)
    email: str = SQLField(unique=True, index=True)
    hashed_password: str
    role: Role = SQLField(default=Role.professional)
    # Sel individuel pour dériver la clé AES de cet utilisateur.
    encryption_salt: str
    created_at: datetime = SQLField(default_factory=datetime.utcnow)


class Seal(SQLModel, table=True):
    """Entrée du registre append-only (hash-chain).

    Chaque nouveau scellement référence le `previous_chain_hash` du précédent,
    ce qui rend toute altération rétroactive détectable (façon Merkle log).
    """

    id: int | None = SQLField(default=None, primary_key=True)
    document_hash: str = SQLField(index=True)  # SHA-256 hex (64 car.)
    document_type: DocumentType = SQLField(default=DocumentType.other)
    owner_id: int = SQLField(foreign_key="user.id", index=True)
    label: str | None = None
    sealed_at: datetime = SQLField(default_factory=datetime.utcnow, index=True)
    # Chaîne de hachage interne
    previous_chain_hash: str
    chain_hash: str = SQLField(index=True)
    chain_index: int = SQLField(index=True)
    # Ancrage blockchain externe (optionnel)
    onchain_tx_hash: str | None = None
    onchain_block_number: int | None = None


class StoredFile(SQLModel, table=True):
    """Fichier chiffré stocké côté serveur (le serveur ne peut pas le lire)."""

    id: int | None = SQLField(default=None, primary_key=True)
    owner_id: int = SQLField(foreign_key="user.id", index=True)
    original_filename: str
    storage_path: str  # chemin relatif dans settings.storage_dir
    document_hash: str = SQLField(index=True)  # hash du contenu clair
    size_bytes: int
    uploaded_at: datetime = SQLField(default_factory=datetime.utcnow)


# ---------- Schémas API ----------


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Role = Role.professional


class UserRead(BaseModel):
    id: int
    email: EmailStr
    role: Role
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SealRequest(BaseModel):
    """Demande de scellement.

    `document_hash` est un SHA-256 hex (64 caractères). Aucune information
    sur le contenu n'est jamais transmise au serveur.
    """

    document_hash: str = Field(pattern=r"^[0-9a-fA-F]{64}$")
    document_type: DocumentType = DocumentType.other
    label: str | None = Field(default=None, max_length=256)


class SealResponse(BaseModel):
    seal_id: int
    document_hash: str
    document_type: DocumentType
    sealed_at: datetime
    chain_index: int
    chain_hash: str
    previous_chain_hash: str
    onchain_tx_hash: str | None = None
    onchain_block_number: int | None = None


class VerifyRequest(BaseModel):
    document_hash: str = Field(pattern=r"^[0-9a-fA-F]{64}$")


class VerifyResponse(BaseModel):
    exists: bool
    seal: SealResponse | None = None
    chain_valid: bool = True
