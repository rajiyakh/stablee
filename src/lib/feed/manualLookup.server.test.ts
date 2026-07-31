import { describe, expect, it, vi } from "vitest";
import { getTokenPairs } from "@/lib/market/dexscreener.server";
import { detectRisks } from "@/lib/market/trending";
import type { DexMarket, ScoredMarket } from "@/lib/market/types";
import { buildManualAgentPost, classifyColdTokenEvent } from "./manualLookup.server";

vi.mock("@/lib/market/dexscreener.server", () => ({
  getTokenPairs: vi.fn(),
}));

const HOUR = 60 * 60 * 1000;

const baseMarket: DexMarket = {
  source: "dexscreener",
  chainId: "robinhood",
  dexId: "uniswap",
  pairAddress: "0xpair",
  url: null,
  baseToken: { address: "0xbase", name: "Test Token", symbol: "TEST" },
  quoteToken: { address: "0xquote", name: "USD Coin", symbol: "USDC" },
  priceUsd: 1.23,
  priceNative: 1.23,
  priceChange: { m5: 0.5, h1: 1, h6: 2, h24: 3 },
  volume: { m5: 2000, h1: 10000, h6: 40000, h24: 150000 },
  txns: {
    m5: { buys: 8, sells: 6 },
    h1: { buys: 40, sells: 35 },
    h6: { buys: 150, sells: 140 },
    h24: { buys: 600, sells: 580 },
  },
  liquidityUsd: 80000,
  fdv: null,
  marketCap: null,
  pairCreatedAt: Date.now() - HOUR * 24 * 30, // 30 days old -- not a "new pair"
  imageUrl: null,
  headerUrl: null,
  websites: [],
  socials: [],
  boostAmount: null,
};

function scoredFixture(
  marketOverrides: Partial<DexMarket> = {},
  trendScore: number | null = 20,
): ScoredMarket {
  const market = { ...baseMarket, ...marketOverrides };
  return { market, trendScore, components: {}, risks: detectRisks(market) };
}

describe("classifyColdTokenEvent", () => {
  it("classifies a brand-new pair as new_pair_detected, taking priority over other signals", () => {
    const scored = scoredFixture({ pairCreatedAt: Date.now() - 1000 * 60 * 5 }, 80);
    expect(classifyColdTokenEvent(scored)).toBe("new_pair_detected");
  });

  it("classifies a strongly-trending, sufficiently-liquid token as entered_trending", () => {
    const scored = scoredFixture({ liquidityUsd: 80000 }, 70);
    expect(classifyColdTokenEvent(scored)).toBe("entered_trending");
  });

  it("classifies thin liquidity as low_liquidity_attention rather than entered_trending", () => {
    const scored = scoredFixture({ liquidityUsd: 500 }, 70);
    expect(classifyColdTokenEvent(scored)).toBe("low_liquidity_attention");
  });

  it("classifies a large one-sided price move as extreme_price_move", () => {
    const scored = scoredFixture({ priceChange: { m5: 0, h1: 10, h6: 40, h24: 90 } }, 20);
    expect(classifyColdTokenEvent(scored)).toBe("extreme_price_move");
  });

  it("classifies lopsided buy/sell flow as buy_sell_imbalance", () => {
    const scored = scoredFixture(
      {
        txns: {
          m5: { buys: 2, sells: 1 },
          h1: { buys: 10, sells: 5 },
          h6: { buys: 40, sells: 20 },
          h24: { buys: 190, sells: 10 },
        },
      },
      20,
    );
    expect(classifyColdTokenEvent(scored)).toBe("buy_sell_imbalance");
  });

  it("returns null when nothing about the token stands out", () => {
    const scored = scoredFixture({}, 20);
    expect(classifyColdTokenEvent(scored)).toBeNull();
  });
});

describe("buildManualAgentPost", () => {
  it("returns a not_found failure when the address has no trading pairs", async () => {
    vi.mocked(getTokenPairs).mockResolvedValue({
      data: [],
      fetchedAt: new Date().toISOString(),
      cached: false,
      stale: false,
    });

    const result = await buildManualAgentPost("robinhood", "0xdead");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("not_found");
  });

  it("returns a no_analysis failure when the token shows no strong signal", async () => {
    const quietMarket: DexMarket = {
      ...baseMarket,
      priceChange: { m5: 0, h1: 0.1, h6: 0.1, h24: 0.2 },
      volume: { m5: 50, h1: 100, h6: 800, h24: 12000 },
      txns: {
        m5: { buys: 1, sells: 1 },
        h1: { buys: 3, sells: 3 },
        h6: { buys: 12, sells: 11 },
        h24: { buys: 30, sells: 28 },
      },
      liquidityUsd: 30_000,
    };
    vi.mocked(getTokenPairs).mockResolvedValue({
      data: [quietMarket],
      fetchedAt: new Date().toISOString(),
      cached: false,
      stale: false,
    });

    const result = await buildManualAgentPost("robinhood", "0xbase");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("no_analysis");
  });

  it("returns a full multi-agent post with consensus and no trade setups for a new pair", async () => {
    vi.mocked(getTokenPairs).mockResolvedValue({
      data: [{ ...baseMarket, pairCreatedAt: Date.now() - 1000 * 60 * 5 }],
      fetchedAt: new Date().toISOString(),
      cached: false,
      stale: false,
    });

    const result = await buildManualAgentPost("robinhood", "0xbase");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.event.type).toBe("new_pair_detected");
    expect(result.messages.length).toBeGreaterThan(0);
    expect(result.messages.every((m) => !m.tradeSetup)).toBe(true);
    expect(result.consensus.token.address).toBe(result.token.address);
  });

  it("picks the highest-liquidity pair when multiple pairs exist for the token", async () => {
    const freshPair = { pairCreatedAt: Date.now() - 1000 * 60 * 5 };
    vi.mocked(getTokenPairs).mockResolvedValue({
      data: [
        { ...baseMarket, ...freshPair, pairAddress: "0xlow", liquidityUsd: 100 },
        { ...baseMarket, ...freshPair, pairAddress: "0xhigh", liquidityUsd: 999_000 },
      ],
      fetchedAt: new Date().toISOString(),
      cached: false,
      stale: false,
    });

    const result = await buildManualAgentPost("robinhood", "0xbase");
    if (!result.ok) throw new Error("expected a successful result");
    expect(result.token.pairAddress).toBe("0xhigh");
  });
});
