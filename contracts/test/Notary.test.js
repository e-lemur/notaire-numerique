const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Notary", function () {
  async function deploy() {
    const Notary = await ethers.getContractFactory("Notary");
    const notary = await Notary.deploy();
    await notary.waitForDeployment();
    return notary;
  }

  it("scelle un hash et stocke son timestamp", async function () {
    const notary = await deploy();
    const h = ethers.keccak256(ethers.toUtf8Bytes("mon document"));
    await expect(notary.seal(h)).to.emit(notary, "Sealed");
    const t = await notary.sealedAt(h);
    expect(t).to.be.greaterThan(0n);
    expect(await notary.isSealed(h)).to.equal(true);
  });

  it("ignore les scellements suivants du même hash (unicité)", async function () {
    const notary = await deploy();
    const h = ethers.keccak256(ethers.toUtf8Bytes("doc"));
    await notary.seal(h);
    const t1 = await notary.sealedAt(h);
    // Avance le temps de la chaîne
    await ethers.provider.send("evm_increaseTime", [60]);
    await ethers.provider.send("evm_mine");
    await notary.seal(h);
    const t2 = await notary.sealedAt(h);
    expect(t1).to.equal(t2);
  });

  it("renvoie 0 pour un hash non scellé", async function () {
    const notary = await deploy();
    const h = ethers.keccak256(ethers.toUtf8Bytes("inconnu"));
    expect(await notary.sealedAt(h)).to.equal(0n);
    expect(await notary.isSealed(h)).to.equal(false);
  });
});
