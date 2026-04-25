# Parcours utilisateur complet

Ce guide illustre le cycle de vie d'un document scellé dans
**Trust-Seal**, de la création au contrôle par un tiers.

---

## 1. Démarrage en local (30 secondes)

```bash
# Terminal 1 — backend
cd backend && uv sync && uv run uvicorn app.main:app --reload

# Terminal 2 — page publique de vérification
cd frontend-verify && python3 -m http.server 8080
```

- API : http://localhost:8000 — documentation interactive sur `/docs`
- Vérification publique : http://localhost:8080

## 2. Inscription (avocat, notaire ou médecin)

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"avocat@cabinet.fr","password":"motdepasse123","role":"professional"}'
```

## 3. Connexion → JWT

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -d "username=avocat@cabinet.fr&password=motdepasse123" | jq -r .access_token)
```

## 4. Scellement d'un document (via curl)

Le serveur ne voit que le hash :

```bash
HASH=$(sha256sum contrat.pdf | cut -d' ' -f1)
curl -X POST http://localhost:8000/seal \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"document_hash\":\"$HASH\",\"document_type\":\"legal\",\"label\":\"Contrat X\"}"
```

## 5. Scellement via l'extension Chrome

1. Charger l'extension depuis `extension/` (mode développeur).
2. Cliquer sur l'icône → saisir l'URL de l'API + email/mdp → « Se connecter ».
3. Sélectionner un fichier, choisir le type, cliquer « Sceller ».
4. Le hash est calculé **localement** dans le navigateur.
5. Le certificat PDF s'ouvre via le lien « Télécharger le PDF ».

## 6. Vérification par un tiers (juge, banque, autre avocat)

1. Ouvrir http://localhost:8080.
2. Glisser-déposer le fichier reçu.
3. La page affiche :
   - ✓ *Document scellé et authentique* — avec horodatage, index de chaîne, hash de chaîne.
   - ✗ *Aucun scellement trouvé* — le document n'existe pas dans le registre OU a été modifié depuis.

## 7. Cas d'usage médical

Le champ `document_type=medical` est conçu pour les dossiers patient :

- **Côté professionnel** : un médecin scelle l'ordonnance ou le résultat
  d'analyse juste après l'avoir signée. Aucun contenu (ni nom, ni diagnostic)
  ne quitte son ordinateur.
- **Côté patient / assurance** : le patient envoie le document original +
  le certificat PDF. Le tiers peut vérifier sur la page publique que le
  document est bien celui qui a été signé par le médecin à tel instant,
  sans avoir besoin de contacter le cabinet.

## 8. Option : ancrage on-chain

Pour renforcer l'antériorité avec la force probante d'une blockchain
publique :

```bash
# Terminal 3 — blockchain locale
cd contracts
npx hardhat node
# dans un autre terminal
npx hardhat run scripts/deploy.js --network localhost
# → "Notary déployé à : 0xABCD..."
```

Puis ajouter dans `backend/.env` :

```
WEB3_RPC_URL=http://127.0.0.1:8545
NOTARY_CONTRACT_ADDRESS=0xABCD...
WEB3_PRIVATE_KEY=<clé privée d'un compte Hardhat>
```

Redémarrer le backend — chaque scellement produira désormais aussi une
transaction on-chain, visible dans la réponse via `onchain_tx_hash` et
`onchain_block_number`.

Pour un testnet public (Polygon Amoy, Ethereum Sepolia, …) : remplacer
`WEB3_RPC_URL` par votre endpoint RPC et déployer le contrat avec
`hardhat run scripts/deploy.js --network <nom>`.

## 9. Preuve ZK (démonstration)

```bash
cd circuits
npm install
./scripts/build.sh
```

Génère et vérifie automatiquement une preuve Groth16 de la connaissance
d'un pré-image Poseidon. C'est la brique fondamentale qui servira aux
preuves métier (propriété cadastrale, preuve d'âge, etc.) dans les
versions futures.

## 10. Audit d'intégrité de la chaîne interne

```bash
curl -X POST http://localhost:8000/admin/chain/verify \
  -H "Authorization: Bearer $TOKEN"
# {"valid": true, "first_corrupted_index": null}
```

Si quelqu'un modifie une entrée dans la base SQLite, `valid=false` et
`first_corrupted_index` pointe la première incohérence — ce qui rend le
registre **tamper-evident**.
