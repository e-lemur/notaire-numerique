"""Initialisation de la base de données SQLite via SQLModel."""

from collections.abc import Iterator

from sqlmodel import Session, SQLModel, create_engine

from .config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
)


def init_db() -> None:
    """Crée les tables si elles n'existent pas."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    """Dependency FastAPI : ouvre une session par requête."""
    with Session(engine) as session:
        yield session
