#!/usr/bin/env bash
# Compile le circuit HashChecker, exécute le setup Groth16, génère une preuve
# et la vérifie. Ce script sert aussi de test d'intégration du circuit.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BUILD="$ROOT/build"
mkdir -p "$BUILD"

# Résolution du binaire circom
CIRCOM="${CIRCOM:-circom}"
if ! command -v "$CIRCOM" >/dev/null 2>&1; then
  echo "Erreur : le binaire 'circom' n'est pas dans le PATH." >&2
  echo "Installez-le depuis https://github.com/iden3/circom/releases" >&2
  echo "Puis placez-le dans ~/.local/bin et rendez-le exécutable." >&2
  exit 1
fi

SNARKJS="$ROOT/node_modules/.bin/snarkjs"
if [ ! -x "$SNARKJS" ]; then
  echo "Erreur : snarkjs introuvable — lancez 'npm install' d'abord." >&2
  exit 1
fi

echo "==> 1. Compilation Circom"
"$CIRCOM" HashChecker.circom --r1cs --wasm --sym -o "$BUILD" -l node_modules

echo "==> 2. Téléchargement (ou réutilisation) du Powers-of-Tau"
PTAU="$BUILD/pot12_final.ptau"
if [ ! -f "$PTAU" ]; then
  "$SNARKJS" powersoftau new bn128 12 "$BUILD/pot12_0000.ptau" -v
  "$SNARKJS" powersoftau contribute "$BUILD/pot12_0000.ptau" "$BUILD/pot12_0001.ptau" \
    --name="doc-seal" -e="$(date +%s%N)" -v
  "$SNARKJS" powersoftau prepare phase2 "$BUILD/pot12_0001.ptau" "$PTAU" -v
fi

echo "==> 3. Setup Groth16 (phase 2)"
"$SNARKJS" groth16 setup "$BUILD/HashChecker.r1cs" "$PTAU" "$BUILD/HashChecker_0000.zkey"
"$SNARKJS" zkey contribute "$BUILD/HashChecker_0000.zkey" "$BUILD/HashChecker_final.zkey" \
  --name="doc-seal-contrib" -e="$(date +%s%N)"
"$SNARKJS" zkey export verificationkey "$BUILD/HashChecker_final.zkey" "$BUILD/verification_key.json"

echo "==> 4. Génération d'une preuve de démonstration"
node "$ROOT/scripts/compute_input.mjs" > "$BUILD/input.json"
"$SNARKJS" wtns calculate "$BUILD/HashChecker_js/HashChecker.wasm" "$BUILD/input.json" "$BUILD/witness.wtns"
"$SNARKJS" groth16 prove "$BUILD/HashChecker_final.zkey" "$BUILD/witness.wtns" \
  "$BUILD/proof.json" "$BUILD/public.json"

echo "==> 5. Vérification"
"$SNARKJS" groth16 verify "$BUILD/verification_key.json" "$BUILD/public.json" "$BUILD/proof.json"

echo ""
echo "OK — le circuit HashChecker compile, prouve et vérifie correctement."
