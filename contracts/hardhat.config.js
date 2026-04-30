require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/**
 * Variables d'environnement attendues (uniquement pour les déploiements
 * vers un testnet/mainnet ; pas requises pour `npx hardhat test`) :
 *
 *   AMOY_RPC_URL       — endpoint JSON-RPC Polygon Amoy
 *                        (ex: https://rpc-amoy.polygon.technology)
 *   AMOY_PRIVATE_KEY   — clé privée du wallet déployeur, financé en MATIC test
 *   POLYGONSCAN_API_KEY— optionnel, pour vérifier le contrat sur Polygonscan
 *
 * Voir docs/onchain-deployment.md pour la procédure complète (faucet,
 * génération de wallet jetable, déploiement, vérification).
 */

const { AMOY_RPC_URL, AMOY_PRIVATE_KEY, POLYGONSCAN_API_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {},
    localhost: { url: "http://127.0.0.1:8545" },
    amoy: {
      url: AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
      chainId: 80002,
      // Une clé privée n'est ajoutée que si elle est fournie : sans elle, on
      // peut toujours compiler / tester sans déclencher d'erreur.
      accounts: AMOY_PRIVATE_KEY ? [AMOY_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: POLYGONSCAN_API_KEY || "",
    },
  },
};
