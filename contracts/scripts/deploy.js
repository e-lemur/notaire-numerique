const hre = require("hardhat");

async function main() {
  const Notary = await hre.ethers.getContractFactory("Notary");
  const notary = await Notary.deploy();
  await notary.waitForDeployment();
  const address = await notary.getAddress();
  console.log("Notary déployé à :", address);
  console.log("Ajoutez à votre .env backend :");
  console.log(`  NOTARY_CONTRACT_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
