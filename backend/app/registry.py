"""Registre append-only façon *hash-chain*.

Chaque nouveau scellement intègre le `chain_hash` précédent dans son propre
`chain_hash`. Altérer une entrée historique invalide toutes les entrées
postérieures — c'est la propriété fondamentale d'un *tamper-evident log*
(équivalent minimaliste d'une blockchain privée).
"""

from __future__ import annotations

import hashlib
from datetime import datetime

from sqlmodel import Session, select

from .models import DocumentType, Seal

GENESIS_HASH = "0" * 64  # chain_hash initial avant toute entrée


def compute_chain_hash(
    previous_chain_hash: str,
    document_hash: str,
    owner_id: int,
    sealed_at: datetime,
    document_type: DocumentType,
    chain_index: int,
) -> str:
    """Calcul déterministe du chain_hash d'une entrée.

    Le format sérialisé doit rester stable dans le temps ; on le versionne
    via un préfixe ``v1:`` pour permettre une future évolution.
    """
    payload = (
        f"v1:{previous_chain_hash}:{document_hash}:{owner_id}:"
        f"{sealed_at.isoformat()}:{document_type.value}:{chain_index}"
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def get_last_seal(session: Session) -> Seal | None:
    """Retourne la dernière entrée du registre, ou None s'il est vide."""
    stmt = select(Seal).order_by(Seal.chain_index.desc()).limit(1)  # type: ignore[attr-defined]
    return session.exec(stmt).first()


def append_seal(
    session: Session,
    *,
    document_hash: str,
    document_type: DocumentType,
    owner_id: int,
    label: str | None,
) -> Seal:
    """Ajoute un scellement au registre et retourne l'entrée persistée."""
    last = get_last_seal(session)
    previous_chain_hash = last.chain_hash if last else GENESIS_HASH
    chain_index = (last.chain_index + 1) if last else 0
    sealed_at = datetime.utcnow()
    chain_hash = compute_chain_hash(
        previous_chain_hash=previous_chain_hash,
        document_hash=document_hash,
        owner_id=owner_id,
        sealed_at=sealed_at,
        document_type=document_type,
        chain_index=chain_index,
    )
    seal = Seal(
        document_hash=document_hash,
        document_type=document_type,
        owner_id=owner_id,
        label=label,
        sealed_at=sealed_at,
        previous_chain_hash=previous_chain_hash,
        chain_hash=chain_hash,
        chain_index=chain_index,
    )
    session.add(seal)
    session.commit()
    session.refresh(seal)
    return seal


def verify_chain_integrity(session: Session) -> tuple[bool, int | None]:
    """Recalcule toute la chaîne et renvoie ``(valide, premier_index_corrompu)``.

    Utilisé par l'endpoint ``/admin/chain/verify`` et par les tests.
    """
    stmt = select(Seal).order_by(Seal.chain_index.asc())  # type: ignore[attr-defined]
    seals = session.exec(stmt).all()
    expected_previous = GENESIS_HASH
    for idx, seal in enumerate(seals):
        if seal.chain_index != idx:
            return False, idx
        if seal.previous_chain_hash != expected_previous:
            return False, idx
        expected_hash = compute_chain_hash(
            previous_chain_hash=seal.previous_chain_hash,
            document_hash=seal.document_hash,
            owner_id=seal.owner_id,
            sealed_at=seal.sealed_at,
            document_type=seal.document_type,
            chain_index=seal.chain_index,
        )
        if expected_hash != seal.chain_hash:
            return False, idx
        expected_previous = seal.chain_hash
    return True, None
