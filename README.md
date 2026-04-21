# Notaire Numérique Inviolable

**MVP v0** — Une plateforme SaaS qui permet aux professions juridiques (avocats, notaires)
et médicales de **sceller** et d'**authentifier** des documents de manière cryptographique,
garantissant l'intégrité et l'antériorité d'un dossier sans jamais compromettre le secret
des données.

> *« Le Dropbox Notarié »* — transforme n'importe quel fichier numérique en un actif
> juridique tamponné par les mathématiques.

---

## Piliers

1. **Antériorité incontestable** — un *hash* SHA-256 du document est ancré dans un registre
   append-only (*hash-chain*) et optionnellement sur une blockchain publique. Un document
   modifié d'un seul octet ne correspond plus.
2. **Confidentialité absolue** — le document lui-même n'est jamais stocké en clair côté
   serveur. Chiffrement AES-256-GCM avec clé par utilisateur (dérivée PBKDF2). Seul
   l'utilisateur peut lire ses documents.
3. **Preuve à divulgation nulle de connaissance** — circuit Circom (`HashChecker`) qui
   permet de prouver la connaissance d'un pré-image sans le révéler.

## Architecture (monorepo)

| Dossier | Stack | Rôle |
|---|---|---|
| `backend/` | Python 3.12, FastAPI, SQLite, AES-GCM, JWT | API : `/seal`, `/verify`, `/upload`, `/certificate` |
| `extension/` | Chrome MV3, JavaScript | Extension navigateur « Sceller ce document » |
| `circuits/` | Circom 2, circomlib, snarkjs (Groth16) | Circuits ZK (HashChecker) |
| `contracts/` | Solidity 0.8.x, Hardhat | Contrat d'ancrage on-chain (optionnel) |
| `frontend-verify/` | HTML/JS vanilla | Page publique de vérification (drag & drop) |

## Démarrage rapide

```bash
# Backend
cd backend && uv sync && uv run uvicorn app.main:app --reload

# Frontend de vérification (static)
cd frontend-verify && python3 -m http.server 8080

# Circuit ZK (compile + setup Groth16 + test de preuve)
cd circuits && npm install && ./scripts/build.sh

# Smart contract (Hardhat local)
cd contracts && npm install && npx hardhat node  # dans un autre terminal : npx hardhat run scripts/deploy.js
```

Voir [`docs/USAGE.md`](docs/USAGE.md) pour le parcours utilisateur complet.

## Déploiement Render (MVP de test)

Le repo inclut un blueprint `render.yaml` prêt à l'emploi pour déployer le backend FastAPI sur Render.

- Service : `notaire-numerique-backend`
- Runtime : Python
- Root directory : `backend/`
- Build command : `pip install .`
- Start command : `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Health check : `/health`

Limite importante du plan gratuit : le système de fichiers local est **éphémère**. Donc la base SQLite (`backend/data/notaire.db`) et les fichiers chiffrés (`backend/storage/`) peuvent être perdus après redéploiement ou redémarrage. C'est acceptable pour une **démo MVP**, mais pas pour la conservation durable des dossiers. Une fois l'URL Render connue, renseignez-la dans les « Paramètres avancés » de la web app ou redéployez `frontend-verify/` avec la nouvelle URL d'API.

## Workflow utilisateur

1. **Stockage** : l'avocat dépose le dossier « Affaire X » → chiffrement AES-GCM serveur.
2. **Scellement** : clic sur l'extension → hash SHA-256 → POST `/seal` → enregistré dans
   la hash-chain (et éventuellement on-chain).
3. **Certification** : téléchargement du PDF *Certificat de Fiducité Numérique*.
4. **Vérification** : un tiers (juge, banque) dépose le fichier sur la page publique →
   le hash est recalculé et retrouvé dans le registre avec son horodatage.

## Types de documents supportés

- `legal` — contrats, testaments, actes notariés
- `medical` — dossiers patient, ordonnances, résultats (conforme au principe de secret
  médical : seul le hash est public, le document reste chiffré).
- `other` — n'importe quel fichier numérique

## Licence

MIT — voir [LICENSE](LICENSE).
