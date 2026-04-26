"""Point d'entrée FastAPI — expose toutes les routes publiques."""

from __future__ import annotations

from datetime import timedelta
from typing import Annotated

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status  # noqa: F401
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from . import __version__
from .auth import (
    CurrentUser,
    create_access_token,
    hash_password,
    verify_password,
)
from .chain import anchor
from .config import settings
from .crypto import derive_key, encrypt_bytes, generate_salt, sha256_hex
from .database import get_session, init_db
from .models import (
    DocumentType,
    Seal,
    SealRequest,
    SealResponse,
    StoredFile,
    Token,
    User,
    UserCreate,
    UserRead,
    VerifyRequest,
    VerifyResponse,
)
from .pdf import render_certificate
from .registry import append_seal, verify_chain_integrity

SessionDep = Annotated[Session, Depends(get_session)]

app = FastAPI(
    title="Doc-Seal",
    description=(
        "API de scellement cryptographique de documents à valeur juridique. "
        "Seules des empreintes SHA-256 transitent par le registre — le contenu "
        "des documents n'est jamais divulgué."
    ),
    version=__version__,
)

_cors_regex = settings.cors_origin_regex or r"(chrome-extension://.*|https?://.*)"
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=_cors_regex,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    init_db()


# -------- Métadonnées --------


@app.get("/", tags=["meta"])
def root() -> dict[str, str]:
    return {
        "service": "Doc-Seal",
        "version": __version__,
        "docs": "/docs",
    }


@app.get("/health", tags=["meta"])
def health() -> dict[str, str | bool]:
    return {"status": "ok", "onchain_anchor": anchor.enabled}


# -------- Auth --------


@app.post("/auth/register", response_model=UserRead, tags=["auth"])
def register(payload: UserCreate, session: SessionDep) -> User:
    existing = session.exec(select(User).where(User.email == payload.email)).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un compte existe déjà avec cet email",
        )
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        encryption_salt=generate_salt(),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@app.post("/auth/login", response_model=Token, tags=["auth"])
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: SessionDep,
) -> Token:
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(
        subject=user.email,
        expires_delta=timedelta(minutes=settings.jwt_expire_minutes),
    )
    return Token(access_token=token)


@app.get("/auth/me", response_model=UserRead, tags=["auth"])
def me(current: CurrentUser) -> User:
    return current


# -------- Scellement --------


@app.post("/seal", response_model=SealResponse, tags=["seal"])
def seal_document(
    payload: SealRequest,
    current: CurrentUser,
    session: SessionDep,
) -> SealResponse:
    """Scelle un hash dans la hash-chain, et l'ancre on-chain si configuré.

    Seule l'empreinte SHA-256 est nécessaire — le serveur n'a jamais accès
    au document source.
    """
    seal = append_seal(
        session,
        document_hash=payload.document_hash.lower(),
        document_type=payload.document_type,
        owner_id=current.id or 0,
        label=payload.label,
    )
    tx_hash, block_number = anchor.seal(seal.document_hash)
    if tx_hash:
        seal.onchain_tx_hash = tx_hash
        seal.onchain_block_number = block_number
        session.add(seal)
        session.commit()
        session.refresh(seal)
    return _seal_to_response(seal)


@app.post("/verify", response_model=VerifyResponse, tags=["seal"])
def verify(payload: VerifyRequest, session: SessionDep) -> VerifyResponse:
    """Vérifie publiquement qu'un hash est scellé dans le registre.

    Cet endpoint est intentionnellement non authentifié — la vérification
    doit pouvoir être effectuée par un tiers (juge, banque, autre avocat).
    """
    hash_hex = payload.document_hash.lower()
    seal = session.exec(select(Seal).where(Seal.document_hash == hash_hex)).first()
    chain_valid, _ = verify_chain_integrity(session)
    if seal is None:
        return VerifyResponse(exists=False, seal=None, chain_valid=chain_valid)
    return VerifyResponse(
        exists=True,
        seal=_seal_to_response(seal),
        chain_valid=chain_valid,
    )


@app.get("/certificate/{seal_id}", tags=["seal"])
def download_certificate(
    seal_id: int,
    current: CurrentUser,
    session: SessionDep,
) -> Response:
    seal = session.get(Seal, seal_id)
    if seal is None:
        raise HTTPException(status_code=404, detail="Scellement introuvable")
    if seal.owner_id != current.id:
        raise HTTPException(status_code=403, detail="Ce scellement ne vous appartient pas")
    pdf_bytes = render_certificate(seal, current.email)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="certificat-{seal.id}-{seal.document_hash[:12]}.pdf"'
            )
        },
    )


@app.get("/seals", response_model=list[SealResponse], tags=["seal"])
def list_my_seals(current: CurrentUser, session: SessionDep) -> list[SealResponse]:
    stmt = (
        select(Seal)
        .where(Seal.owner_id == current.id)
        .order_by(Seal.sealed_at.desc())  # type: ignore[attr-defined]
    )
    return [_seal_to_response(s) for s in session.exec(stmt).all()]


# -------- Coffre-fort (upload chiffré) --------


@app.post("/vault/upload", tags=["vault"])
def upload_to_vault(
    current: CurrentUser,
    session: SessionDep,
    passphrase: Annotated[str, Form(min_length=8)],
    file: Annotated[UploadFile, File(...)],
    document_type: Annotated[DocumentType, Form()] = DocumentType.other,
    label: Annotated[str | None, Form()] = None,
    seal: Annotated[bool, Form()] = True,
) -> dict:
    """Upload chiffré : le fichier est chiffré AES-GCM avec une clé dérivée
    de ``passphrase`` puis son hash est scellé.

    La passphrase n'est jamais stockée — si l'utilisateur la perd, le fichier
    est irrécupérable (c'est le principe du coffre-fort).
    """
    raw = file.file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Fichier vide")
    document_hash = sha256_hex(raw)
    key = derive_key(passphrase, current.encryption_salt)
    blob = encrypt_bytes(raw, key, associated_data=document_hash.encode("ascii"))

    storage_path = f"{current.id}/{document_hash}.enc"
    full_path = settings.storage_dir / storage_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    full_path.write_bytes(blob)

    stored = StoredFile(
        owner_id=current.id or 0,
        original_filename=file.filename or "document",
        storage_path=storage_path,
        document_hash=document_hash,
        size_bytes=len(raw),
    )
    session.add(stored)
    session.commit()
    session.refresh(stored)

    seal_resp: SealResponse | None = None
    if seal:
        seal_entry = append_seal(
            session,
            document_hash=document_hash,
            document_type=document_type,
            owner_id=current.id or 0,
            label=label,
        )
        tx_hash, block_number = anchor.seal(seal_entry.document_hash)
        if tx_hash:
            seal_entry.onchain_tx_hash = tx_hash
            seal_entry.onchain_block_number = block_number
            session.add(seal_entry)
            session.commit()
            session.refresh(seal_entry)
        seal_resp = _seal_to_response(seal_entry)

    return {
        "stored_file_id": stored.id,
        "document_hash": document_hash,
        "size_bytes": stored.size_bytes,
        "seal": seal_resp.model_dump() if seal_resp else None,
    }


@app.post("/admin/chain/verify", tags=["admin"])
def admin_verify_chain(current: CurrentUser, session: SessionDep) -> dict:
    """Recalcule la hash-chain complète. Utile pour audit."""
    _ = current  # nécessite simplement d'être authentifié
    valid, bad_index = verify_chain_integrity(session)
    return {"valid": valid, "first_corrupted_index": bad_index}


# -------- Helpers --------


def _seal_to_response(seal: Seal) -> SealResponse:
    return SealResponse(
        seal_id=seal.id or 0,
        document_hash=seal.document_hash,
        document_type=seal.document_type,
        sealed_at=seal.sealed_at,
        chain_index=seal.chain_index,
        chain_hash=seal.chain_hash,
        previous_chain_hash=seal.previous_chain_hash,
        onchain_tx_hash=seal.onchain_tx_hash,
        onchain_block_number=seal.onchain_block_number,
    )
