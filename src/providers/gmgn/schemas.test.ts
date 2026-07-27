import { describe, expect, it } from "vitest";
import { gmgnHotSearchesResponseSchema, gmgnTrendingResponseSchema } from "./schemas";
import { normalizeHotSearches, normalizeTrending } from "./normalize";

/**
 * Fixture fields are a trimmed real example captured from a live
 * `gmgn-cli market trending --chain robinhood` call — including the fields
 * that turned out to differ from the originally-documented guesses:
 * `is_honeypot`/`is_renounced` as numbers (0/1) not booleans,
 * `creation_timestamp` (not `created_timestamp`),
 * `history_highest_market_cap` (not `history_highest_marketcap`),
 * `twitter_username` (not `twitter`), and `launchpad_platform`.
 * These tests exist specifically to catch a regression if any of these
 * field names or types drift again.
 */
const REAL_TRENDING_ITEM = {
  chain: "robinhood",
  address: "0x2ad022332400df20948f20f593c1074b88f6e753",
  name: "$PENGUZILLA",
  symbol: "PENGUZILLA",
  logo: "https://gmgn.ai/external-res/3f0fe5e8265680e4b37897453e7b9ab1_v2.webp",
  price: 0.000433785,
  price_change_percent: 4281.54,
  volume: 986214,
  liquidity: 81116.9,
  market_cap: 417232,
  history_highest_market_cap: 665300,
  swaps: 8075,
  buys: 4076,
  sells: 3999,
  holder_count: 709,
  top_10_holder_rate: 0.4122,
  creation_timestamp: 1785158728,
  launchpad_platform: "circus",
  renounced_mint: null,
  renounced_freeze_account: null,
  is_wash_trading: false,
  gas_fee: 2.782031904120781,
  dev_team_hold_rate: 0,
  bundler_rate: 0.0132,
  is_honeypot: 0,
  is_renounced: 1,
  is_open_source: 1,
  rank: 1,
  visiting_count: 984,
  twitter_username: "",
  website: "",
  telegram: "",
};

describe("gmgnTrendingResponseSchema against a real captured response", () => {
  const realEnvelope = {
    code: 0,
    data: { rank: [REAL_TRENDING_ITEM] },
    message: "success",
    reason: "",
  };

  it("parses the real { code, data: { rank: [...] } } envelope", () => {
    const parsed = gmgnTrendingResponseSchema.parse(realEnvelope);
    expect(parsed).toHaveLength(1);
  });

  it("normalizes is_honeypot (real: number 0/1) to a real boolean", () => {
    const parsed = gmgnTrendingResponseSchema.parse(realEnvelope);
    const normalized = normalizeTrending(parsed, "1h");
    expect(normalized[0].security?.honeypot).toBe(false);
  });

  it("falls back to is_renounced when renounced_mint/renounced_freeze_account are null (real Robinhood behavior)", () => {
    const parsed = gmgnTrendingResponseSchema.parse(realEnvelope);
    const normalized = normalizeTrending(parsed, "1h");
    expect(normalized[0].security?.renounced).toBe(true);
  });

  it("reads the real creation_timestamp field for age/createdAt", () => {
    const parsed = gmgnTrendingResponseSchema.parse(realEnvelope);
    const normalized = normalizeTrending(parsed, "1h");
    expect(normalized[0].createdAt).toBe(new Date(1785158728 * 1000).toISOString());
    expect(normalized[0].ageSeconds).toBeGreaterThan(0);
  });

  it("reads the real history_highest_market_cap field for athMarketCapUsd", () => {
    const parsed = gmgnTrendingResponseSchema.parse(realEnvelope);
    const normalized = normalizeTrending(parsed, "1h");
    expect(normalized[0].athMarketCapUsd).toBe(665300);
  });

  it("falls back dexName to launchpad_platform when dex is absent", () => {
    const parsed = gmgnTrendingResponseSchema.parse(realEnvelope);
    const normalized = normalizeTrending(parsed, "1h");
    expect(normalized[0].dexName).toBe("circus");
  });
});

describe("gmgnHotSearchesResponseSchema against a real captured response", () => {
  const realEnvelope = [
    { interval: "1h", chain: "robinhood", version: "abc123", tokens: [{ ...REAL_TRENDING_ITEM }] },
  ];

  it("parses the real bare-array-of-blocks shape with the `tokens` field (not `rank`)", () => {
    const blocks = gmgnHotSearchesResponseSchema.parse(realEnvelope);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].tokens).toHaveLength(1);
  });

  it("normalizes a hot-searches block end to end", () => {
    const blocks = gmgnHotSearchesResponseSchema.parse(realEnvelope);
    const normalized = normalizeHotSearches(blocks[0].tokens, "1h");
    expect(normalized[0].searchRank).toBe(1);
    expect(normalized[0].searchHeat).toBe(984);
  });
});
