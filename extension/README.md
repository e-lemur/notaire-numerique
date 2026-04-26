# Extension Chrome — Doc-Seal

Extension Manifest V3 pour sceller un document depuis le navigateur sans
jamais transmettre son contenu.

## Installation (dev)

1. Ouvrir `chrome://extensions`.
2. Activer le mode développeur (coin supérieur droit).
3. Cliquer « Charger l'extension non empaquetée » et sélectionner ce dossier
   `extension/`.
4. L'icône Doc-Seal apparaît dans la barre.

> Les icônes placeholder sont dans `icons/`. Remplacez-les par les vôtres
> avant publication.

## Fonctionnement

1. L'utilisateur saisit l'URL de l'API + ses identifiants → récupère un JWT.
2. Il choisit un fichier local.
3. Le fichier est lu en mémoire dans l'extension (via `File.arrayBuffer()`).
4. `SubtleCrypto.digest("SHA-256", …)` calcule l'empreinte **localement**.
5. Seul le hash hex est envoyé à `POST /seal`.
6. Le certificat est affiché et un lien permet de télécharger le PDF.

## Permissions

- `storage` : stocke le JWT dans `chrome.storage.local` (session).
- `activeTab` : réservé pour une évolution future (scellement du fichier
  attaché à l'onglet).
- `host_permissions` : autorisé uniquement pour `http://localhost:8000` en
  développement. En production, ajoutez votre domaine (ex: `https://api.votre-domaine.fr/*`).
