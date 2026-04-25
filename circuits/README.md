# Circuits ZK — Trust-Seal

## HashChecker

Prouve la connaissance d'un pré-image `secret` tel que
`Poseidon(secret) == publicHash`, sans révéler `secret`.

### Pourquoi Poseidon ?

Poseidon est une fonction de hachage **spécifiquement conçue pour les champs
finis des ZK-SNARKs**. Elle coûte environ **200 contraintes** dans un circuit,
contre **~30 000 contraintes pour SHA-256** — ce qui la rend pratique pour
des preuves interactives côté client (navigateur).

### Pré-requis

- Node.js ≥ 18
- Binaire [`circom`](https://docs.circom.io/getting-started/installation/) ≥ 2.1.4 dans le `PATH`

### Build + test

```bash
npm install
./scripts/build.sh
```

À la fin, vous devez voir :

```
[INFO]  snarkJS: OK!
OK — le circuit HashChecker compile, prouve et vérifie correctement.
```

### Fichiers générés dans `build/`

| Fichier | Rôle |
|---|---|
| `HashChecker.r1cs` | Contraintes du circuit (R1CS) |
| `HashChecker_js/HashChecker.wasm` | Exécutable de génération du witness |
| `HashChecker_final.zkey` | Clé de preuve Groth16 |
| `verification_key.json` | Clé publique de vérification |
| `proof.json` + `public.json` | Preuve de démonstration |

La clé `verification_key.json` peut être utilisée côté backend (ou dans un
contrat Solidity via `snarkjs zkey export solidityverifier`) pour vérifier
toute preuve soumise par un utilisateur.

### Intégration future

- **Preuve de propriété cadastrale (notaire)** : `OwnershipChecker.circom`
  combinerait une preuve de Merkle (fichier cadastral) avec le `HashChecker`
  pour prouver *« mon nom est dans cette parcelle »* sans divulguer le nom.
- **Preuve d'âge (médical / juridique)** : circuit qui prouve qu'une date de
  naissance (privée) est antérieure à `today - 18 ans` (public) sans révéler
  la date exacte.
