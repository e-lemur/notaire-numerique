// Calcule un `publicHash = Poseidon(secret)` valide pour alimenter le witness.
// Utilise la référence Poseidon de circomlibjs (bonne parité avec circomlib en
// circuit) ; c'est comme ça qu'on prouve que notre paire (secret, publicHash)
// est cohérente avec ce que le circuit calcule.
import { buildPoseidon } from "circomlibjs";

const secret = BigInt(process.env.SECRET ?? "123456789");
const poseidon = await buildPoseidon();
const hash = poseidon.F.toString(poseidon([secret]));

process.stdout.write(
  JSON.stringify({ secret: secret.toString(), publicHash: hash }, null, 2) + "\n"
);
