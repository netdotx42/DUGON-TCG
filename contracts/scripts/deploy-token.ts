import { ethers, network } from "hardhat";
import { TOKEN_ALLOCATIONS } from "./token-config";

/**
 * Deploys the DUGON DAO ($DUGON) ERC-20. Testnet only: refuses to run on any chain other than
 * Base Sepolia (84532) or the local Hardhat network (31337).
 *
 * Wallets come from contracts/.env (DUGON_INITIAL_WALLET, DUGON_DEV_WALLET, ...). Any wallet left
 * empty falls back to the deployer address, so double-check the printed table.
 *
 *   npm run deploy:token:base-sepolia
 */
async function main() {
  const { chainId } = await ethers.provider.getNetwork();
  if (chainId !== 84532n && chainId !== 31337n) {
    throw new Error(`Refusing to deploy to chain ${chainId}. DUGON DAO is testnet-only (Base Sepolia 84532).`);
  }
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("No deployer account. Set DEPLOYER_PRIVATE_KEY in contracts/.env (a throwaway testnet key).");

  const labels: string[] = [];
  const recipients: string[] = [];
  const bps: number[] = [];
  for (const a of TOKEN_ALLOCATIONS) {
    const raw = (process.env[a.env] || "").trim();
    if (raw && !ethers.isAddress(raw)) throw new Error(`${a.env} is not a valid address: ${raw}`);
    labels.push(a.label);
    recipients.push(raw ? ethers.getAddress(raw) : deployer.address);
    bps.push(a.bps);
  }
  const totalBps = bps.reduce((s, b) => s + b, 0);
  if (totalBps !== 10_000) throw new Error(`Allocations total ${totalBps} bps; they must total 10000.`);

  console.log(`Network:   ${network.name} (${chainId})`);
  console.log(`Deployer:  ${deployer.address}`);
  console.log(`Balance:   ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);
  console.log("Allocation (598,000,000 DUGON):");
  TOKEN_ALLOCATIONS.forEach((a, i) => {
    const fallback = process.env[a.env]?.trim() ? "" : "  (deployer: " + a.env + " not set)";
    console.log(`  ${a.label.padEnd(10)} ${(a.bps / 100).toFixed(2).padStart(6)}%  ${recipients[i]}${fallback}`);
  });

  const factory = await ethers.getContractFactory("DugonDaoToken");
  const token = await factory.deploy(labels, recipients, bps);
  console.log(`\nDeploy tx: ${token.deploymentTransaction()?.hash}`);
  await token.waitForDeployment();
  const address = await token.getAddress();
  console.log(`DugonDaoToken deployed at ${address}`);
  console.log(`Total supply: ${ethers.formatEther(await token.totalSupply())} DUGON`);
  if (chainId === 84532n) {
    console.log(`Explorer:  https://sepolia.basescan.org/token/${address}`);
    console.log(`\nOptional verify:`);
    console.log(`  npx hardhat verify --network baseSepolia --constructor-args scripts/token-args.js ${address}`);
    console.log(`  (token-args.js: module.exports = ${JSON.stringify([labels, recipients, bps])};)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
