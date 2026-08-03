import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchJsonMock = vi.fn();

vi.mock("@/lib/market/http.server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/market/http.server")>();
  return {
    ...actual,
    fetchJson: (...args: unknown[]) => fetchJsonMock(...args),
  };
});

const ORIGINAL_ENV = { ...process.env };
const params = {
  fromChainId: 1,
  toChainId: 4663,
  fromToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  toToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  fromAmount: "1000000",
  sender: "0xsender000000000000000000000000000000000",
  recipient: "0xsender000000000000000000000000000000000",
  slippageBps: null,
};

beforeEach(() => {
  vi.resetModules();
  fetchJsonMock.mockReset();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.GASZIP_ENABLED;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("gaszipAdapter", () => {
  it("is disabled by default (GASZIP_ENABLED unset)", async () => {
    const { gaszipAdapter } = await import("./gaszip.server");
    expect(gaszipAdapter.configured()).toBe(false);
  });

  it('is configured once GASZIP_ENABLED is exactly "true"', async () => {
    process.env.GASZIP_ENABLED = "true";
    const { gaszipAdapter } = await import("./gaszip.server");
    expect(gaszipAdapter.configured()).toBe(true);
  });

  it("feeMode is always unavailable, even when enabled — no fee mechanism exists", async () => {
    process.env.GASZIP_ENABLED = "true";
    const { gaszipAdapter } = await import("./gaszip.server");
    expect(gaszipAdapter.feeMode()).toBe("unavailable");
  });

  it("getQuote always returns null, regardless of enabled state", async () => {
    process.env.GASZIP_ENABLED = "true";
    const { gaszipAdapter } = await import("./gaszip.server");
    const result = await gaszipAdapter.getQuote(params);
    expect(result).toBeNull();
  });

  it("getSupportedTokens reports only the native asset for a supported chain", async () => {
    fetchJsonMock.mockResolvedValue({
      data: [
        {
          chain: 4663,
          short: 526,
          name: "Robinhood",
          symbol: "ETH",
          decimals: 18,
          inbound: true,
          mainnet: true,
        },
      ],
      fetchedAt: new Date().toISOString(),
      cached: false,
      stale: false,
    });
    const { gaszipAdapter } = await import("./gaszip.server");
    const tokens = await gaszipAdapter.getSupportedTokens(4663);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].symbol).toBe("ETH");
  });
});
