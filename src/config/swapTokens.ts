/**
 * Curated, decimals-aware token list for the swap picker. Distinct from
 * verifiedTokens.ts (site-wide "owner vouches for this" badges, no decimals
 * field) — this list exists specifically for BigInt-safe swap math. Every
 * entry here was confirmed directly against robinhoodchain.blockscout.com's
 * own token API (name/symbol/decimals), never guessed from a symbol. The
 * owner extends this list further with the same verification discipline.
 */
export interface SwapTokenConfig {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
  isStablecoin?: boolean;
  /** True only for entries confirmed via an official/canonical source, not just "looks legit." */
  verified: boolean;
}

/**
 * 0x's (and the broader EVM tooling ecosystem's) standard sentinel for the
 * chain's native asset in sellToken/buyToken. Not observed in an actual 0x
 * response this session — see docs/0X_SWAP_SETUP.md. Native-ETH selling
 * stays disabled (NATIVE_SELL_ENABLED) until that's empirically confirmed.
 */
export const NATIVE_SENTINEL = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const NATIVE_SELL_ENABLED = false;

export const swapTokens: SwapTokenConfig[] = [
  {
    address: "0x0bd7d308f8e1639fab988df18a8011f41eacad73",
    symbol: "WETH",
    name: "WETH",
    decimals: 18,
    verified: true,
  },
  {
    address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
    symbol: "USDG",
    name: "Global Dollar",
    decimals: 6,
    isStablecoin: true,
    verified: true,
  },
  {
    // Confirmed via Blockscout: name "Apple • Robinhood Token", symbol "AAPL", decimals 18.
    // Has a cross-verified Chainlink price feed — see src/config/chainlinkFeeds.ts.
    address: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
    symbol: "AAPL",
    name: "Apple (Robinhood Tokenized Equity)",
    decimals: 18,
    logoUrl:
      "https://cdn.robinhood.com/ncw_assets/logos/0xaf3d76f1834a1d425780943c99ea8a608f8a93f9.png",
    verified: true,
  },
  {
    // Confirmed via Blockscout: name "Amazon • Robinhood Token", symbol "AMZN", decimals 18.
    // Has a cross-verified Chainlink price feed — see src/config/chainlinkFeeds.ts.
    address: "0x12f190a9F9d7D37a250758b26824B97CE941bF54",
    symbol: "AMZN",
    name: "Amazon (Robinhood Tokenized Equity)",
    decimals: 18,
    logoUrl:
      "https://cdn.robinhood.com/ncw_assets/logos/0x12f190a9f9d7d37a250758b26824b97ce941bf54.png",
    verified: true,
  },
];

export const USDG_ADDRESS = swapTokens.find((t) => t.symbol === "USDG")!.address;
export const WETH_ADDRESS = swapTokens.find((t) => t.symbol === "WETH")!.address;

export function findSwapToken(address: string): SwapTokenConfig | undefined {
  return swapTokens.find((t) => t.address.toLowerCase() === address.toLowerCase());
}
