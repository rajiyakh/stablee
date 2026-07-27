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
 * chain's native asset in sellToken/buyToken. Confirmed via a real
 * GET /swap/allowance-holder/price call against Robinhood Chain (chainId
 * 4663): liquidityAvailable: true, route filled through WETH, sellToken
 * echoed back as this exact address — see docs/0X_SWAP_SETUP.md.
 */
export const NATIVE_SENTINEL = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const NATIVE_SELL_ENABLED = true;

/**
 * Reserved when computing the "Max" amount for a native-ETH sell — gas for
 * the swap transaction itself is paid in ETH, so selling the literal full
 * balance would leave nothing to pay for the transaction and it would
 * revert. Observed real Robinhood Chain gas cost for a swap tx is roughly
 * 0.00002 ETH (485258 gas * ~0.0000416 gwei); this reserve is ~50x that for
 * margin against gas price spikes. Only affects native sells — ERC-20 sells
 * already pay gas separately from the token being sold, no reserve needed.
 */
export const NATIVE_GAS_RESERVE_WEI = 1_000_000_000_000_000n; // 0.001 ETH

export const swapTokens: SwapTokenConfig[] = [
  ...(NATIVE_SELL_ENABLED
    ? [
        {
          address: NATIVE_SENTINEL,
          symbol: "ETH",
          name: "Ether",
          decimals: 18,
          verified: true,
        },
      ]
    : []),
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
  // Tokenized-equity tokens (AAPL, AMZN, AMD, ASML, BABA, CLSK, COIN, CRCL)
  // are intentionally NOT listed here. Confirmed live against 0x's real API
  // for all 8: both SELL_TOKEN_NOT_AUTHORIZED_FOR_TRADE and
  // BUY_TOKEN_NOT_AUTHORIZED_FOR_TRADE — a permanent regulatory restriction
  // on 0x's side, not a transient liquidity issue, and symmetric (neither
  // direction works). Listing a token a user can select but can never
  // actually get a quote for is worse than not listing it. Their Chainlink
  // price feeds remain wired in chainlinkFeeds.ts (real, independently
  // useful data) in case a future swap venue supports them, or the
  // restriction changes. See docs/0X_SWAP_SETUP.md.
];

export const USDG_ADDRESS = swapTokens.find((t) => t.symbol === "USDG")!.address;
export const WETH_ADDRESS = swapTokens.find((t) => t.symbol === "WETH")!.address;

export function findSwapToken(address: string): SwapTokenConfig | undefined {
  return swapTokens.find((t) => t.address.toLowerCase() === address.toLowerCase());
}
