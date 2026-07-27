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
 * Only entries verified through BOTH steps are listed. The live Chainlink
 * page currently lists 8 Robinhood tokenized-equity feeds in total (checked
 * directly — an earlier note in this file claimed 33, which was stale/wrong
 * and has been corrected); all 8 have now had their token contract address
 * independently confirmed. Add more by repeating both verification steps if
 * Chainlink adds feeds later — never add a token address from a single
 * unverified source (e.g. a blog post or guide) even if it looks plausible.
 * Blockscout token search returns many scam/impersonator tokens per symbol
 * (e.g. "AMDOG", "ApeSharkMouseLion" for a search of "ASML") — the real
 * Robinhood token is identified by its exact "<Name> • Robinhood Token"
 * naming convention plus a cdn.robinhood.com/ncw_assets/logos/ icon URL,
 * never by holder count or search-result ordering alone.
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
  /**
   * The feed's configured heartbeat (max seconds between updates even with
   * no price deviation), from the live Chainlink feeds table. Every
   * Robinhood tokenized-equity feed observed so far uses 86400s (24h) — a
   * fixed short staleness window (e.g. 1 hour) is wrong for these: a
   * healthy 86400s-heartbeat feed can legitimately sit unchanged for well
   * over an hour during low volatility, and treating that as "stale" makes
   * the Chainlink price tier spuriously unavailable. Verified live: AAPL
   * and BABA were both observed 92 minutes since their last update while
   * every other feed was under 15 minutes — same real deployment, same
   * heartbeat, just genuinely quiet trading.
   */
  heartbeatSeconds: number;
}

export const chainlinkFeeds: ChainlinkFeedConfig[] = [
  {
    // AAPL — Apple • Robinhood Token, confirmed via Blockscout token API
    // (name: "Apple • Robinhood Token", symbol: "AAPL", decimals: 18).
    tokenAddress: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
    // Standard Proxy (AggregatorV3Interface), confirmed via the live Chainlink feeds table.
    feedAddress: "0x6B22A786bAa607d76728168703a39Ea9C99f2cD0",
    feedDecimals: 8,
    heartbeatSeconds: 86400,
  },
  {
    // AMZN — Amazon • Robinhood Token, confirmed via Blockscout token API
    // (name: "Amazon • Robinhood Token", symbol: "AMZN", decimals: 18).
    tokenAddress: "0x12f190a9F9d7D37a250758b26824B97CE941bF54",
    feedAddress: "0xD5a1508ceD74c084eBf3cBe853e2C968fB2a651C",
    feedDecimals: 8,
    heartbeatSeconds: 86400,
  },
  {
    // AMD — AMD • Robinhood Token, confirmed via Blockscout token API
    // (symbol: "AMD", decimals: 18, 18003 holders, cdn.robinhood.com icon).
    tokenAddress: "0x86923f96303D656E4aa86D9d42D1e57ad2023fdC",
    feedAddress: "0x943A29E7ae51A4798823ca9eEd2ed533B2A22C72",
    feedDecimals: 8,
    heartbeatSeconds: 86400,
  },
  {
    // ASML — ASML Holding NV • Robinhood Token, confirmed via Blockscout
    // token API (symbol: "ASML", decimals: 18, cdn.robinhood.com icon).
    tokenAddress: "0x47F93d52cBeC7C6D2CfC080e154002370a60dAEA",
    feedAddress: "0xB4106147E8cce40b7d46124090d373A71b70f87D",
    feedDecimals: 8,
    heartbeatSeconds: 86400,
  },
  {
    // BABA — Alibaba • Robinhood Token, confirmed via Blockscout token API
    // (symbol: "BABA", decimals: 18, cdn.robinhood.com icon). Not to be
    // confused with "Wrapped Alibaba • Robinhood Token" (wBABA) — a
    // different, separately-listed token.
    tokenAddress: "0xad25Ac6C84D497db898fa1E8387bf6Af3532a1c4",
    feedAddress: "0x62Cc8F9b5f56a33c9C8A60c8B92779f523c4E984",
    feedDecimals: 8,
    heartbeatSeconds: 86400,
  },
  {
    // CLSK — CleanSpark • Robinhood Token, confirmed via Blockscout token
    // API (symbol: "CLSK", decimals: 18, cdn.robinhood.com icon).
    tokenAddress: "0xcBB95BBF36099d34dA091dc6Fa6F49EfA257Cee3",
    feedAddress: "0x810c12D3a554Bc47fd39597Fe3b3AAC4941F50eF",
    feedDecimals: 8,
    heartbeatSeconds: 86400,
  },
  {
    // COIN — Coinbase • Robinhood Token, confirmed via Blockscout token API
    // (symbol: "COIN", decimals: 18, cdn.robinhood.com icon). Several
    // higher-holder-count impersonators exist for this symbol (e.g.
    // "Pointlesss Coin", "Penguin Hood Coin") — the naming convention + CDN
    // icon are the only trusted signal, not holder count.
    tokenAddress: "0x6330D8C3178a418788dF01a47479c0ce7CCF450b",
    feedAddress: "0xA3a468A452940B7D6b69991207B508c609a98Ef2",
    feedDecimals: 8,
    heartbeatSeconds: 86400,
  },
  {
    // CRCL — Circle Internet Group • Robinhood Token, confirmed via
    // Blockscout token API (symbol: "CRCL", decimals: 18, cdn.robinhood.com
    // icon). Not to be confused with "Circle Hood by Virtuals".
    tokenAddress: "0xdF0992E440dD0be65BD8439b609d6D4366bf1CB5",
    feedAddress: "0x6652eDf64bA3731C4F2D3ce821A0Fb1f1f6b482a",
    feedDecimals: 8,
    heartbeatSeconds: 86400,
  },
];

export function feedForToken(tokenAddress: string): ChainlinkFeedConfig | null {
  return (
    chainlinkFeeds.find((f) => f.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()) ?? null
  );
}
