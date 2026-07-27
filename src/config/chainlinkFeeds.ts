/**
 * Chainlink is Robinhood Chain's official oracle provider (confirmed via
 * docs.robinhood.com / docs.chain.link). Entries below are real, cross-verified
 * addresses — not guessed:
 *
 *   1. Feed proxy address + decimals: extracted directly from the live,
 *      rendered docs.chain.link/data-feeds/tokenized-equity-feeds/robinhood
 *      page (its feeds table loads asynchronously via client-side JS, so this
 *      required rendering the page, not just fetching its HTML).
 *   2. Token contract address: independently confirmed against
 *      robinhoodchain.blockscout.com's own token API — the token's on-chain
 *      `name`/`symbol` was checked to match the Chainlink feed's stated
 *      "Asset name" before being trusted.
 *
 * Only entries verified through BOTH steps are listed. The Chainlink page
 * lists 33 tokenized-equity feeds in total; only the two below have also had
 * their token contract address independently confirmed so far. Add more by
 * repeating both verification steps — never add a token address from a
 * single unverified source (e.g. a blog post or guide) even if it looks
 * plausible.
 *
 * The reader in src/lib/swap/chainlink.server.ts is real, working code —
 * these entries make it actually fire for AAPL/AMZN; every other token still
 * falls through to the next USD-pricing tier (see docs/SWAP_FEE_MODEL.md).
 */
export interface ChainlinkFeedConfig {
  tokenAddress: string;
  feedAddress: string;
  /** Decimals the feed's answer() is reported in (commonly 8 for USD feeds). */
  feedDecimals: number;
}

export const chainlinkFeeds: ChainlinkFeedConfig[] = [
  {
    // AAPL — Apple • Robinhood Token, confirmed via Blockscout token API
    // (name: "Apple • Robinhood Token", symbol: "AAPL", decimals: 18).
    tokenAddress: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
    // Standard Proxy (AggregatorV3Interface), confirmed via the live Chainlink feeds table.
    feedAddress: "0x6B22A786bAa607d76728168703a39Ea9C99f2cD0",
    feedDecimals: 8,
  },
  {
    // AMZN — Amazon • Robinhood Token, confirmed via Blockscout token API
    // (name: "Amazon • Robinhood Token", symbol: "AMZN", decimals: 18).
    tokenAddress: "0x12f190a9F9d7D37a250758b26824B97CE941bF54",
    feedAddress: "0xD5a1508ceD74c084eBf3cBe853e2C968fB2a651C",
    feedDecimals: 8,
  },
];

export function feedForToken(tokenAddress: string): ChainlinkFeedConfig | null {
  return (
    chainlinkFeeds.find((f) => f.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()) ?? null
  );
}
