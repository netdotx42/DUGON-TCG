import { expect } from "chai";
import { ethers } from "hardhat";

describe("DugonStarterCards", () => {
  async function deploy() {
    const [owner, alice, bob] = await ethers.getSigners();
    const f = await ethers.getContractFactory("DugonStarterCards");
    const c = await f.deploy("https://example.test/meta/", owner.address);
    return { c, owner, alice, bob };
  }

  it("mints one of each starter card (ids 1-5) on claim", async () => {
    const { c, alice } = await deploy();
    await expect(c.connect(alice).claimStarter())
      .to.emit(c, "StarterClaimed")
      .withArgs(alice.address, [1n, 2n, 3n, 4n, 5n]);
    const bals = await c.balanceOfBatch(Array(10).fill(alice.address), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(bals.map(Number)).to.deep.equal([1, 1, 1, 1, 1, 0, 0, 0, 0, 0]);
    expect(await c.hasClaimed(alice.address)).to.equal(true);
    expect(await c.totalClaims()).to.equal(1n);
  });

  it("prevents duplicate claims from the same address", async () => {
    const { c, alice } = await deploy();
    await c.connect(alice).claimStarter();
    await expect(c.connect(alice).claimStarter()).to.be.revertedWithCustomError(c, "AlreadyClaimed");
  });

  it("still blocks a re-claim after the cards are transferred away", async () => {
    const { c, alice, bob } = await deploy();
    await c.connect(alice).claimStarter();
    await c.connect(alice).safeBatchTransferFrom(alice.address, bob.address, [1, 2, 3, 4, 5], [1, 1, 1, 1, 1], "0x");
    await expect(c.connect(alice).claimStarter()).to.be.revertedWithCustomError(c, "AlreadyClaimed");
  });

  it("lets different addresses claim independently", async () => {
    const { c, alice, bob } = await deploy();
    await c.connect(alice).claimStarter();
    await c.connect(bob).claimStarter();
    expect(await c.totalClaims()).to.equal(2n);
  });

  it("rejects claims made through another contract", async () => {
    const { c, alice } = await deploy();
    const f = await ethers.getContractFactory("ClaimProxy");
    const proxy = await f.connect(alice).deploy();
    await expect(proxy.claim(await c.getAddress())).to.be.revertedWithCustomError(c, "ContractCaller");
  });

  it("is free: claimStarter is not payable", async () => {
    const { c, alice } = await deploy();
    await expect(c.connect(alice).claimStarter({ value: 1 } as never)).to.be.rejected;
  });

  it("returns per-token URIs and rejects unknown ids", async () => {
    const { c } = await deploy();
    expect(await c.uri(3)).to.equal("https://example.test/meta/3.json");
    await expect(c.uri(0)).to.be.revertedWith("unknown card");
    await expect(c.uri(11)).to.be.revertedWith("unknown card");
  });

  it("only the owner can change the base URI", async () => {
    const { c, owner, alice } = await deploy();
    await expect(c.connect(alice).setBaseURI("x")).to.be.revertedWithCustomError(c, "OwnableUnauthorizedAccount");
    await c.connect(owner).setBaseURI("ipfs://new/");
    expect(await c.uri(1)).to.equal("ipfs://new/1.json");
  });
});
