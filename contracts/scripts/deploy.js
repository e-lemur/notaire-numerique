const hre = require("hardhat");

async function main() {
  const network = hre.network.name;
  const [deployer] = await hre.ethers.getSigners();

  if (!deployer) {
    throw new Error(
      `Aucun compte configuré pour le réseau '${network}'. ` +
      "Renseignez AMOY_PRIVATE_KEY (et AMOY_RPC_URL) dans contracts/.env."
    );
  }

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Réseau         : ${network}`);
  console.log(`Déployeur      : ${deployer.address}`);
  console.log(`Solde          : ${hre.ethers.formatEther(balance)} ${
    network === "amoy" ? "MATIC" : "ETH"
  }`);

  if (balance === 0n && network !== "hardhat" && network !== "localhost") {
    throw new Error(
      "Solde insuffisant pour déployer. Sur Amoy, financez le wallet via " +
      "https://faucet.polygon.technology/ (sélectionner Amoy)."
    );
  }

  const Notary = await hre.ethers.getContractFactory("Notary");
  const notary = await Notary.deploy();
  await notary.waitForDeployment();
  const address = await notary.getAddress();
  const txHash = notary.deploymentTransaction()?.hash;

  console.log("");
  console.log("✓ Notary déployé.");
  console.log(`  Adresse     : ${address}`);
  if (txHash) console.log(`  Tx          : ${txHash}`);

  if (network === "amoy") {
    console.log(`  Explorer    : https://amoy.polygonscan.com/address/${address}`);
    console.log("");
    console.log("Variables d'environnement à renseigner côté Render (service backend) :");
    console.log(`  WEB3_RPC_URL=${process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology"}`);
    console.log(`  NOTARY_CONTRACT_ADDRESS=${address}`);
    console.log(`  WEB3_PRIVATE_KEY=<clé privée du wallet (vide ou wallet dédié)>`);
    console.log(`  ONCHAIN_EXPLORER_TX_URL=https://amoy.polygonscan.com/tx/{tx}`);
  } else {
    console.log("");
    console.log("Variable backend :");
    console.log(`  NOTARY_CONTRACT_ADDRESS=${address}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
