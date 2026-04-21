"""Configuration centralisée (via variables d'environnement)."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Paramètres de l'application chargés depuis l'environnement.

    Les valeurs par défaut sont adaptées au développement local. En production,
    `JWT_SECRET` DOIT être changé.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Sécurité
    jwt_secret: str = "change-me-in-production-please-use-at-least-32-chars"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 24h

    # Stockage
    data_dir: Path = Path("./data")
    storage_dir: Path = Path("./storage")
    database_url: str = "sqlite:///./data/notaire.db"

    # Ancrage blockchain (optionnel — si non défini, on utilise uniquement la hash-chain interne)
    web3_rpc_url: str | None = None
    notary_contract_address: str | None = None
    web3_private_key: str | None = None

    # CORS — en dev, autorise l'extension + la page de vérification locale
    cors_origins: list[str] = [
        "http://localhost:8080",
        "http://localhost:5173",
        "http://127.0.0.1:8080",
        "chrome-extension://*",
    ]


settings = Settings()
settings.data_dir.mkdir(parents=True, exist_ok=True)
settings.storage_dir.mkdir(parents=True, exist_ok=True)
