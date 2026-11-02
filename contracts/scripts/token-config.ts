/**
 * DUGON DAO ($DUGON) allocation. Shares are in basis points (100 bps = 1%) and must total 10,000.
 *
 * Split: 30% initial supply, 15% dev, 15% marketing, 15% presale, 25% liquidity pool (LP).
 * Change the shares here (and add or remove buckets) before deploying.
 */
export const TOKEN_ALLOCATIONS = [
  { label: "initial", env: "DUGON_INITIAL_WALLET", bps: 3000 },
  { label: "dev", env: "DUGON_DEV_WALLET", bps: 1500 },
  { label: "marketing", env: "DUGON_MARKETING_WALLET", bps: 1500 },
  { label: "presale", env: "DUGON_PRESALE_WALLET", bps: 1500 },
  { label: "liquidity", env: "DUGON_LP_WALLET", bps: 2500 },
] as const;
