# Doc-Seal

**MVP v0** — Plateforme SaaS qui permet aux professions juridiques (avocats,
notaires) et médicales de **sceller** et d'**authentifier** des documents de
manière cryptographique : preuve d'antériorité et d'intégrité, sans jamais
divulguer le contenu protégé par le secret professionnel.

> *« Le tampon mathématique »* — transformez n'importe quel fichier numérique
> en un actif juridique horodaté et infalsifiable.

🌐 Production : <https://doc-seal.com> · API : <https://api.doc-seal.com>

---

## Piliers

1. **Antériorité incontestable** — l'empreinte SHA-256 du document est ancrée
   dans un registre append-only (*hash-chain*) et optionnellement sur une
   blockchain publique. La modification d'un seul octet rend le scellement
   invalide.
2. **Confidentialité absolue** — le contenu du document n'est jamais transmis
   au serveur ; le hash est calculé localement (navigateur ou extension).
   Pour le module de stockage opt-in, chiffrement AES-256-GCM avec clé dérivée
   par utilisateur (PBKDF2).
3. **Preuve à divulgation nulle de connaissance** — circuit Circom
   (`HashChecker`) qui permet de prouver la connaissance d'un pré-image sans
   le révéler.

## Architecture (monorepo)

| Dossier | Stack | Rôle |
|---|---|---|
| `backend/` | Python 3.12, FastAPI, SQLite, AES-GCM, JWT | API : `/seal`, `/verify`, `/upload`, `/certificate` |
| `extension/` | Chrome MV3, JavaScript | Extension navigateur « Sceller ce document » |
| `circuits/` | Circom 2, circomlib, snarkjs (Groth16) | Circuits ZK (HashChecker) |
| `contracts/` | Solidity 0.8.x, Hardhat | Contrat d'ancrage on-chain (optionnel) |
| `frontend-verify/` | HTML/CSS/JS vanilla | Landing publique (`/`) + application (`/app/`) |

## Démarrage rapide

```bash
# Backend
cd backend && uv sync && uv run uvicorn app.main:app --reload

# Frontend (landing + app)
cd frontend-verify && python3 -m http.server 8080
# Landing  : http://localhost:8080/
# Application : http://localhost:8080/app/

# Circuit ZK (compile + setup Groth16 + test de preuve)
cd circuits && npm install && ./scripts/build.sh

# Smart contract (Hardhat local)
cd contracts && npm install && npx hardhat node  # autre terminal : npx hardhat run scripts/deploy.js
```

Voir [`docs/USAGE.md`](docs/USAGE.md) pour le parcours utilisateur complet.

## Workflow utilisateur

1. **Stockage (optionnel)** : l'avocat dépose le dossier « Affaire X »
   → chiffrement AES-GCM côté serveur.
2. **Scellement** : clic sur l'extension ou via l'app web → hash SHA-256 local
   → POST `/seal` → enregistrement dans la hash-chain (et éventuellement
   on-chain).
3. **Certification** : téléchargement du PDF *Certificat de Fiducité Numérique*.
4. **Vérification** : un tiers (juge, banque) dépose le fichier sur la page
   publique → le hash est recalculé et retrouvé dans le registre avec son
   horodatage.

## Types de documents supportés

- `legal` — contrats, testaments, actes notariés
- `medical` — dossiers patient, ordonnances, résultats (conforme au principe
  de secret médical : seul le hash est public, le document reste chiffré).
- `other` — n'importe quel fichier numérique

## Licence

MIT — voir [LICENSE](LICENSE).
