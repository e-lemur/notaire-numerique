# Activation de l'ancrage on-chain (Polygon Amoy)

## Pourquoi

La promesse marketing de Doc-Seal mentionne *« blockchain publique »* et
*« infalsifiable »*. Tant que l'ancrage on-chain n'est pas activé en
production, seule la **hash-chain interne** au backend fait foi — c'est
déjà tamper-evident pour le MVP, mais ce n'est pas ce que la landing
laisse entendre.

Cette procédure publie le contrat `Notary.sol` sur le testnet Polygon
**Amoy** (gratuit, gas négligeable) et configure le backend pour y ancrer
chaque scellement, en plus du registre interne. Le passage en mainnet
Polygon (et la facturation associée) sera traité dans une PR ultérieure
quand un volume client justifiera le coût.

## Pré-requis (côté humain)

1. Un **wallet jetable**. Génération sécurisée :
   ```bash
   cd contracts
   node -e "console.log(require('ethers').Wallet.createRandom().privateKey)"
   ```
   ⚠️ Le wallet sert uniquement à signer des transactions sur Amoy testnet.
   **Ne jamais** y envoyer de la valeur réelle. Stocker la clé privée hors
   du repo (gestionnaire de mots de passe).

2. Du **MATIC test**. Ouvrir https://faucet.polygon.technology/, choisir
   **Polygon Amoy**, coller l'adresse publique du wallet, demander des
   tokens. Quelques minutes plus tard, vérifier sur
   https://amoy.polygonscan.com/address/`<adresse>` que le solde est
   non nul (~0.5 MATIC suffisent largement pour des dizaines de milliers
   de scellements vu le coût ~50 000 gas par appel `seal()`).

3. (Optionnel mais recommandé) Une clé API Polygonscan pour vérifier le
   bytecode du contrat publié, depuis https://polygonscan.com/myapikey.

## Déploiement du contrat

```bash
cd contracts
cp .env.example .env
# Éditer .env :
#   AMOY_RPC_URL=https://rpc-amoy.polygon.technology
#   AMOY_PRIVATE_KEY=0x...                (la clé du wallet jetable)
#   POLYGONSCAN_API_KEY=...               (optionnel)

npm install                # installe dotenv si pas déjà fait
npm run compile
npm run deploy:amoy
```

Le script affiche entre autres :
```
Réseau         : amoy
Déployeur      : 0xABC...
Solde          : 0.50 MATIC
✓ Notary déployé.
  Adresse     : 0xDEF...
  Tx          : 0x...
  Explorer    : https://amoy.polygonscan.com/address/0xDEF...
```

**Notez l'adresse du contrat** — elle est immuable et c'est elle que le
backend interrogera.

(Optionnel) Vérifier le bytecode publié :
```bash
npm run verify:amoy -- 0xDEF...
```

## Configuration du backend en production

Sur le dashboard Render → service `notaire-numerique-backend` →
**Environment** → renseigner les 4 variables marquées `sync: false`
dans `render.yaml` :

| Clé | Valeur |
|---|---|
| `WEB3_RPC_URL` | `https://rpc-amoy.polygon.technology` |
| `NOTARY_CONTRACT_ADDRESS` | l'adresse retournée par `deploy:amoy` |
| `WEB3_PRIVATE_KEY` | la clé privée du wallet (la même qui a déployé, ou un autre wallet jetable financé) |
| `ONCHAIN_EXPLORER_TX_URL` | `https://amoy.polygonscan.com/tx/{tx}` |

Sauvegarder → Render redéploie automatiquement. Au prochain scellement,
le backend appellera `Notary.seal(documentHash)` ; la transaction sera
visible sur `amoy.polygonscan.com`. Si le réseau est indisponible ou si
les variables ne sont pas toutes définies, l'app retombe silencieusement
sur la hash-chain interne (cf. `app/chain.py`, `try/except` autour de
`build_transaction`).

## Vérification fonctionnelle

1. Sceller un document via l'extension ou l'app.
2. Récupérer le `tx_hash` depuis la réponse API ou le PDF.
3. Ouvrir `https://amoy.polygonscan.com/tx/<tx_hash>` → la transaction
   est visible, status *Success*, événement `Sealed(bytes32, address, uint256)`.
4. Re-sceller le même hash → la transaction est minée mais sans modifier
   le mapping (cf. `Notary.sol`, garantit l'unicité de l'horodatage).

## Coûts

- **Amoy testnet** : 0 € (MATIC test gratuits via le faucet, illimités
  en pratique pour un volume MVP).
- **Polygon mainnet** (futur) : ~0.0005 USD par scellement au prix actuel
  du gas (50 000 gas × 30 gwei × 0.2 USD/MATIC). Soit ~50 USD pour 100 000
  scellements. À facturer à 0.10 € HT/scellement dans le plan Cabinet pour
  marge >99 %.

## Sécurité

- La clé privée `WEB3_PRIVATE_KEY` ne doit **jamais** être commitée. Elle
  vit uniquement dans Render Environment et dans `contracts/.env` local
  (lui-même ignoré par git).
- Le wallet est limité à un **solde testnet** : un éventuel leak n'a pas
  de conséquence financière, juste la nécessité d'en générer un nouveau.
- Le contrat `Notary.sol` n'a aucune fonction privilégiée, aucun owner,
  aucune fonction de retrait : il n'y a rien à perdre, même si la clé
  fuit.

## Prochaine étape (hors scope de cette PR)

- Mainnet Polygon : reprendre la même procédure avec un wallet réel et
  ajouter `polygon` dans `hardhat.config.js`. À déclencher uniquement
  quand le pipeline commercial justifie le coût gas opérationnel.
