"""Initialisation de la base de données via SQLModel.

Supporte SQLite (dev local, tests) et PostgreSQL (production Render).
Le choix du backend est piloté par la variable d'environnement
``DATABASE_URL`` (cf. ``app.config``).
"""

from collections.abc import Iterator

from sqlmodel import Session, SQLModel, create_engine

from .config import settings


def _normalize_url(url: str) -> str:
    """Normalise les URLs de base de données.

    Render expose des URLs au format historique ``postgres://`` ; SQLAlchemy
    2.x exige ``postgresql://``. On force aussi le driver moderne ``psycopg``
    (v3) pour rester explicite.
    """
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


_url = _normalize_url(settings.database_url)
_is_sqlite = _url.startswith("sqlite")

engine = create_engine(
    _url,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    # Vérifie la connexion avant chaque utilisation : indispensable contre les
    # coupures de connexion typiques d'un Postgres managé (Render, etc.).
    pool_pre_ping=not _is_sqlite,
)


def init_db() -> None:
    """Crée les tables si elles n'existent pas."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    """Dependency FastAPI : ouvre une session par requête."""
    with Session(engine) as session:
        yield session
