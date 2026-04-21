pragma circom 2.1.4;

include "../node_modules/circomlib/circuits/poseidon.circom";

/*
 * HashChecker
 *
 *   Prouve la connaissance d'un `secret` tel que Poseidon(secret) == publicHash,
 *   sans révéler `secret`.
 *
 *   Pourquoi Poseidon et pas SHA-256 ?
 *     - SHA-256 coûte ~30 000 contraintes, Poseidon ~200 (sur 1 entrée).
 *     - Poseidon est conçu pour les champs finis des ZK-SNARKs.
 *
 *   Entrée privée : `secret`  (un élément du champ BN254)
 *   Entrée publique : `publicHash` (Poseidon(secret), attesté publiquement)
 *
 *   La contrainte `hasher.out === publicHash` échoue si le prouveur
 *   ne connaît pas le bon pré-image.
 */
template HashChecker() {
    signal input secret;
    signal input publicHash;

    component hasher = Poseidon(1);
    hasher.inputs[0] <== secret;

    hasher.out === publicHash;
}

component main {public [publicHash]} = HashChecker();
