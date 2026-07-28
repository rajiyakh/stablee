import { beforeEach, describe, expect, it, vi } from "vitest";

const readContractMock = vi.fn();

vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return {
    ...actual,
    createPublicClient: () => ({ readContract: readContractMock }),
  };
});

vi.mock("@/providers/gmgn/client.server", () => ({
  gmgnConfigured: vi.fn(),
  fetchGmgnTrending: vi.fn(),
}));

vi.mock("@/config/robinhoodChain", () => ({
  robinhoodChainFacts: {
    id: 4663,
    name: "Robinhood Chain",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } },
  },
}));

const NEW_TOKEN = "0x1111111111111111111111111111111111aaaa";
const WETH_ADDRESS = "0x0bd7d308f8e1639fab988df18a8011f41eacad73";

vi.mock("@/providers/gmgn/schemas", () => ({
  gmgnTrendingResponseSchema: { parse: (data: unknown) => data },
}));

vi.mock("@/providers/gmgn/normalize", () => ({
  normalizeTrending: () => [
    {
      address: NEW_TOKEN,
      symbol: "NEWT",
      name: "New Token",
      rank: 1,
      chain: "robinhood",
      provider: "GMGN",
      updatedAt: new Date().toISOString(),
    },
    {
      // Already in the curated list — must be skipped, never duplicated.
      address: WETH_ADDRESS,
      symbol: "WETH",
      name: "WETH",
      rank: 2,
      chain: "robinhood",
      provider: "GMGN",
      updatedAt: new Date().toISOString(),
    },
  ],
}));

describe("discoverSwapTokens", () => {
  beforeEach(async () => {
    vi.resetModules();
    readContractMock.mockReset();
    const gmgn = await import("@/providers/gmgn/client.server");
    vi.mocked(gmgn.gmgnConfigured).mockReturnValue(true);
    vi.mocked(gmgn.fetchGmgnTrending).mockResolvedValue({
      data: {},
      fetchedAt: new Date().toISOString(),
      cached: false,
      stale: false,
    });
  });

  it("returns [] when GMGN is not configured", async () => {
    const gmgn = await import("@/providers/gmgn/client.server");
    vi.mocked(gmgn.gmgnConfigured).mockReturnValue(false);

    const { discoverSwapTokens } = await import("./discoverTokens.server");
    expect(await discoverSwapTokens()).toEqual([]);
  });

  it("skips a candidate already in the curated registry (never duplicates)", async () => {
    readContractMock.mockResolvedValue(18);
    const { discoverSwapTokens } = await import("./discoverTokens.server");
    const result = await discoverSwapTokens();
    expect(result.some((t) => t.address.toLowerCase() === WETH_ADDRESS.toLowerCase())).toBe(false);
  });

  it("includes a new candidate only when decimals are confirmed on-chain", async () => {
    readContractMock.mockResolvedValue(9);
    const { discoverSwapTokens } = await import("./discoverTokens.server");
    const result = await discoverSwapTokens();
    const found = result.find((t) => t.address === NEW_TOKEN);
    expect(found).toBeDefined();
    expect(found?.decimals).toBe(9);
    expect(found?.verified).toBe(true);
    expect(found?.source).toBe("gmgn");
  });

  it("never fabricates decimals — drops a candidate whose on-chain read fails", async () => {
    readContractMock.mockRejectedValue(new Error("call reverted"));
    const { discoverSwapTokens } = await import("./discoverTokens.server");
    const result = await discoverSwapTokens();
    expect(result.find((t) => t.address === NEW_TOKEN)).toBeUndefined();
  });
});
