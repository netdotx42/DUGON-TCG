import { HardhatUserConfig, subtask } from "hardhat/config";
import { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } from "hardhat/builtin-tasks/task-names";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import path from "node:path";

const SOLC_VERSION = "0.8.24";

// Use the solc-js compiler from node_modules when the native compiler download is unavailable
// (e.g. restricted CI networks). Set HARDHAT_NATIVE_SOLC=1 to use Hardhat's normal downloader.
if (!process.env.HARDHAT_NATIVE_SOLC) {
  subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, async (args: { solcVersion: string }, _hre, runSuper) => {
    if (args.solcVersion !== SOLC_VERSION) return runSuper();
    const compilerPath = path.join(__dirname, "node_modules", "solc", "soljson.js");
    return { compilerPath, isSolcJs: true, version: SOLC_VERSION, longVersion: SOLC_VERSION };
  });
}

const pk = process.env.DEPLOYER_PRIVATE_KEY;
const validPk = pk && /^(0x)?[0-9a-fA-F]{64}$/.test(pk) ? [pk.startsWith("0x") ? pk : `0x${pk}`] : [];

const config: HardhatUserConfig = {
  solidity: { version: SOLC_VERSION, settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "cancun" } },
  networks: {
    hardhat: {},
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      chainId: 84532,
      accounts: validPk,
    },
  },
  etherscan: {
    apiKey: { baseSepolia: process.env.BASESCAN_API_KEY || "" },
  },
};

export default config;
