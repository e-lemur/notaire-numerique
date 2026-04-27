# Migration SQLite → PostgreSQL

## Pourquoi

En production sur Render, le filesystem du plan **free** est éphémère :
le disque est remis à zéro à chaque redéploiement automatique. Une base
SQLite stockée sur ce disque (`./data/notaire.db`) perd donc tous les
scellements à chaque push, ce qui est rédhibitoire pour un produit qui
vend précisément la **persistance et l'antériorité** d'une preuve.

Cette migration branche le backend sur une base **PostgreSQL managée** par
Render, persistante, sauvegardée et redondée.

## Ce qui change techniquement

- `psycopg[binary]` (driver Postgres v3) ajouté aux dépendances core de
  `backend/pyproject.toml`. Le driver historique `psycopg2` n'est pas
  utilisé.
- `app/database.py` normalise désormais l'URL de connexion :
  - `postgres://…` → `postgresql://…` (Render fournit l'ancien format,
    SQLAlchemy 2.x exige le nouveau).
  - `postgresql://…` → `postgresql+psycopg://…` (force psycopg v3).
- `pool_pre_ping=True` activé pour Postgres pour résister aux coupures
  de connexion typiques d'une base managée.
- `render.yaml` déclare une section `databases:` (`doc-seal-db`, plan
  free) et injecte automatiquement `DATABASE_URL` dans le service
  backend via `fromDatabase`.
- `tests/conftest.py` utilise le même normaliseur : on peut donc lancer
  toute la suite contre Postgres pour validation.

## Vérification locale (Docker)

```bash
# 1. Démarrer un Postgres jetable
docker run -d --rm --name pg-test \
  -e POSTGRES_PASSWORD=test -e POSTGRES_DB=docseal -e POSTGRES_USER=docseal \
  -p 55432:5432 postgres:16-alpine

# 2. Lancer la suite contre Postgres
cd backend
DATABASE_URL="postgresql://docseal:test@localhost:55432/docseal" uv run pytest -q

# 3. Lancer la suite contre SQLite (par défaut)
uv run pytest -q

# 4. Nettoyage
docker stop pg-test
```

Les deux exécutions doivent retourner **16 passed**.

## Première mise en production

Au prochain push sur `main` après merge de la PR :

1. **Render lit `render.yaml`** et détecte la nouvelle section
   `databases:`. Il provisionne une base Postgres `doc-seal-db` (~1 minute).
2. **L'env var `DATABASE_URL`** est automatiquement renseignée sur le
   service backend (via `fromDatabase`).
3. **Le redéploiement du backend** crée les tables au démarrage (l'app
   appelle `SQLModel.metadata.create_all` dans le `lifespan`).
4. À partir de ce moment, **les scellements et comptes sont persistés**
   et survivent aux redéploiements.

## Limites du plan free

- 1 GB de stockage (largement suffisant pour des hashes — chaque
  scellement pèse ~300 octets).
- **Expire après 90 jours**. À ce moment-là, Render facture le plan
  Starter (~7 USD/mois) ou la base est suspendue. Il faut donc passer
  au plan payant **avant** l'échéance.
- Pas de réplica de lecture, pas d'extension PostGIS, etc. — non
  nécessaires pour notre usage.

## Reprise des données existantes (si applicable)

Si la base SQLite courante (`./data/notaire.db`) contient déjà des
scellements à conserver, on peut les exporter avant la bascule :

```bash
# Sur la machine de dev avec accès au fichier SQLite
sqlite3 data/notaire.db .dump > dump.sql

# Adapter le SQL pour Postgres (BLOB → bytea, AUTOINCREMENT → SERIAL,
# etc.) — pgloader ou un script dédié peuvent automatiser cette étape.
pip install pgloader  # ou via apt
pgloader sqlite:///$(pwd)/data/notaire.db postgresql://...
```

Ce cas n'est pas automatisé : il est rare et nécessite une vérification
manuelle de l'intégrité du `chain_hash` après import.

## Rollback

En cas de problème en prod : retirer la section `databases:` de
`render.yaml` et l'env var `DATABASE_URL`. Le backend retombera sur
SQLite local au redémarrage. Les éventuels scellements créés via
Postgres ne seront alors plus accessibles tant que la connexion
Postgres n'est pas restaurée.
