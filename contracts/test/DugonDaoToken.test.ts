import { expect } from "chai";
import { ethers } from "hardhat";
import { TOKEN_ALLOCATIONS } from "../scripts/token-config";

const SUPPLY = ethers.parseEther("598000000");

describe("DugonDaoToken", () => {
  async function deploy() {
    const [deployer, initial, dev, marketing, presale, lp, alice] = await ethers.getSigners();
    const wallets = [initial, dev, marketing, presale, lp];
    const f = await ethers.getContractFactory("DugonDaoToken");
    const token = await f.deploy(
      TOKEN_ALLOCATIONS.map((a) => a.label),
      wallets.map((w) => w.address),
      TOKEN_ALLOCATIONS.map((a) => a.bps),
    );
    return { token, f, deployer, wallets, initial, dev, marketing, presale, lp, alice };
  }

  it("has the right name, ticker, decimals and fixed supply", async () => {
    const { token } = await deploy();
    expect(await token.name()).to.equal("DUGON DAO");
    expect(await token.symbol()).to.equal("DUGON");
    expect(await token.decimals()).to.equal(18n);
    expect(await token.totalSupply()).to.equal(SUPPLY);
    expect(await token.TOTAL_SUPPLY()).to.equal(SUPPLY);
  });

  it("uses the 30/15/15/15/25 split from token-config", async () => {
    expect(TOKEN_ALLOCATIONS.map((a) => [a.label, a.bps])).to.deep.equal([
      ["initial", 3000],
      ["dev", 1500],
      ["marketing", 1500],
      ["presale", 1500],
      ["liquidity", 2500],
    ]);
  });

  it("mints each bucket to its wallet and records it", async () => {
    const { token, initial, dev, marketing, presale, lp, deployer } = await deploy();
    expect(await token.balanceOf(initial.address)).to.equal(ethers.parseEther("179400000"));
    expect(await token.balanceOf(dev.address)).to.equal(ethers.parseEther("89700000"));
    expect(await token.balanceOf(marketing.address)).to.equal(ethers.parseEther("89700000"));
    expect(await token.balanceOf(presale.address)).to.equal(ethers.parseEther("89700000"));
    expect(await token.balanceOf(lp.address)).to.equal(ethers.parseEther("149500000"));
    expect(await token.balanceOf(deployer.address)).to.equal(0n);

    expect(await token.allocationCount()).to.equal(5n);
    const a4 = await token.allocation(4);
    expect(a4.label).to.equal("liquidity");
    expect(a4.recipient).to.equal(lp.address);
    expect(a4.bps).to.equal(2500n);
    expect(a4.amount).to.equal(ethers.parseEther("149500000"));
  });

  it("emits AllocationMinted per bucket", async () => {
    const { token, dev } = await deploy();
    const tx = token.deploymentTransaction()!;
    await expect(tx).to.emit(token, "AllocationMinted").withArgs("dev", dev.address, 1500, ethers.parseEther("89700000"));
  });

  it("has no way to mint more after deployment", async () => {
    const { token } = await deploy();
    const fns = token.interface.fragments.filter((f) => f.type === "function").map((f) => (f as { name: string }).name);
    expect(fns.some((n) => /mint/i.test(n))).to.equal(false);
  });

  it("supports transfers and burning", async () => {
    const { token, dev, alice } = await deploy();
    await token.connect(dev).transfer(alice.address, ethers.parseEther("100"));
    expect(await token.balanceOf(alice.address)).to.equal(ethers.parseEther("100"));
    await token.connect(alice).burn(ethers.parseEther("40"));
    expect(await token.balanceOf(alice.address)).to.equal(ethers.parseEther("60"));
    expect(await token.totalSupply()).to.equal(SUPPLY - ethers.parseEther("40"));
  });

  it("tracks voting power after delegation", async () => {
    const { token, presale } = await deploy();
    expect(await token.getVotes(presale.address)).to.equal(0n);
    await token.connect(presale).delegate(presale.address);
    expect(await token.getVotes(presale.address)).to.equal(ethers.parseEther("89700000"));
  });

  it("rejects shares that do not total 100%", async () => {
    const { f, wallets } = await deploy();
    await expect(
      f.deploy(["initial", "dev", "marketing", "presale"], wallets.slice(0, 4).map((w) => w.address), [3000, 1500, 1500, 1500]),
    ).to.be.revertedWithCustomError(f, "SharesMustTotal100Percent").withArgs(7500);
  });

  it("rejects a zero-address wallet, a zero share, and mismatched arrays", async () => {
    const { f, wallets } = await deploy();
    const addrs = wallets.map((w) => w.address);
    const labels = TOKEN_ALLOCATIONS.map((a) => a.label);
    const bps = TOKEN_ALLOCATIONS.map((a) => a.bps);
    await expect(f.deploy(labels, [...addrs.slice(0, 4), ethers.ZeroAddress], bps))
      .to.be.revertedWithCustomError(f, "ZeroRecipient").withArgs(4);
    await expect(f.deploy([...labels, "x"], [...addrs, addrs[0]], [...bps.slice(0, 4), 2500, 0]))
      .to.be.revertedWithCustomError(f, "ZeroShare").withArgs(5);
    await expect(f.deploy(labels.slice(0, 4), addrs, bps)).to.be.revertedWithCustomError(f, "LengthMismatch");
    await expect(f.deploy([], [], [])).to.be.revertedWithCustomError(f, "NoAllocations");
  });
});
