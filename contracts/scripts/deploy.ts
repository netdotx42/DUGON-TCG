import { ethers, network } from "hardhat";

/**
 * Deploys DugonStarterCards. Testnet only: refuses to run on any chain other than
 * Base Sepolia (84532) or the local Hardhat network (31337).
 *
 *   DEPLOYER_PRIVATE_KEY=... npm run deploy:base-sepolia
 */
async function main() {
  const { chainId } = await ethers.provider.getNetwork();
  if (chainId !== 84532n && chainId !== 31337n) {
    throw new Error(`Refusing to deploy to chain ${chainId}. DUGON TCG is testnet-only (Base Sepolia 84532).`);
  }
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("No deployer account. Set DEPLOYER_PRIVATE_KEY in contracts/.env (a throwaway testnet key).");

  const baseUri = process.env.CARD_METADATA_BASE_URI || "https://dugon-tcg.vercel.app/metadata/";
  const owner = process.env.CONTRACT_OWNER || deployer.address;
  console.log(`Network:   ${network.name} (${chainId})`);
  console.log(`Deployer:  ${deployer.address}`);
  console.log(`Balance:   ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  console.log(`Base URI:  ${baseUri}`);

  const factory = await ethers.getContractFactory("DugonStarterCards");
  const contract = await factory.deploy(baseUri, owner);
  const tx = contract.deploymentTransaction();
  console.log(`Deploy tx: ${tx?.hash}`);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`\nDugonStarterCards deployed at ${address}`);
  if (chainId === 84532n) {
    console.log(`Explorer:  https://sepolia.basescan.org/address/${address}`);
    console.log(`\nNext steps:`);
    console.log(`  1. Set NEXT_PUBLIC_DUGON_CONTRACT_ADDRESS=${address} in the web app env (.env.local / Vercel).`);
    console.log(`  2. Optional: npm run verify:base-sepolia -- ${address} "${baseUri}" ${owner}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
