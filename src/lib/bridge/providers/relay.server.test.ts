import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const ORIGINAL_ENV = { ...process.env };

const params = {
  fromChainId: 1,
  toChainId: 4663,
  fromToken: "0xfromtoken0000000000000000000000000000",
  toToken: "0xtotoken00000000000000000000000000000000",
  fromAmount: "1000000",
  sender: "0xsender000000000000000000000000000000000",
  recipient: "0xsender000000000000000000000000000000000",
  slippageBps: null,
};

function setConfigured() {
  process.env.RELAY_ENABLED = "true";
  process.env.RELAY_API_KEY = "test-key";
  process.env.ROBINPULSE_TREASURY_ADDRESS = "0x0bd7d308f8e1639fab988df18a8011f41eacad72";
  process.env.BRIDGE_PLATFORM_FEE_BPS = "100";
}

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

beforeEach(() => {
  vi.resetModules();
  fetchMock.mockReset();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.RELAY_ENABLED;
  delete process.env.RELAY_API_KEY;
  delete process.env.RELAY_APP_FEE_CONFIRMED;
  delete process.env.ROBINPULSE_TREASURY_ADDRESS;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("relayAdapter.configured", () => {
  it("is false with no env configured", async () => {
    const { relayAdapter } = await import("./relay.server");
    expect(relayAdapter.configured()).toBe(false);
  });

  it("is true once enabled + api key + treasury are present", async () => {
    setConfigured();
    const { relayAdapter } = await import("./relay.server");
    expect(relayAdapter.configured()).toBe(true);
  });
});

describe("relayAdapter.feeMode", () => {
  it("is unavailable when configured but RELAY_APP_FEE_CONFIRMED is not set", async () => {
    setConfigured();
    const { relayAdapter } = await import("./relay.server");
    expect(relayAdapter.feeMode()).toBe("unavailable");
  });

  it("is provider-native once RELAY_APP_FEE_CONFIRMED is true", async () => {
    setConfigured();
    process.env.RELAY_APP_FEE_CONFIRMED = "true";
    const { relayAdapter } = await import("./relay.server");
    expect(relayAdapter.feeMode()).toBe("provider-native");
  });
});

describe("relayAdapter.getQuote", () => {
  it("returns null without calling the API when not configured", async () => {
    const { relayAdapter } = await import("./relay.server");
    const result = await relayAdapter.getQuote(params);
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null (never throws) on a non-ok response", async () => {
    setConfigured();
    fetchMock.mockResolvedValue(jsonResponse({}, false, 400));
    const { relayAdapter } = await import("./relay.server");
    const result = await relayAdapter.getQuote(params);
    expect(result).toBeNull();
  });

  it("does not send appFees in the request body when RELAY_APP_FEE_CONFIRMED is unset", async () => {
    setConfigured();
    fetchMock.mockResolvedValue(jsonResponse({ steps: [], fees: {} }));
    const { relayAdapter } = await import("./relay.server");
    await relayAdapter.getQuote(params);
    const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sentBody.appFees).toBeUndefined();
  });

  it("sends appFees once RELAY_APP_FEE_CONFIRMED is true", async () => {
    setConfigured();
    process.env.RELAY_APP_FEE_CONFIRMED = "true";
    fetchMock.mockResolvedValue(jsonResponse({ steps: [], fees: {} }));
    const { relayAdapter } = await import("./relay.server");
    await relayAdapter.getQuote(params);
    const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sentBody.appFees).toEqual([
      { recipient: "0x0bd7d308f8e1639fab988df18a8011f41eacad72", fee: "100" },
    ]);
  });

  it("results in fee_missing downstream when the response has no fees.app (never fabricates a fee)", async () => {
    setConfigured();
    process.env.RELAY_APP_FEE_CONFIRMED = "true";
    fetchMock.mockResolvedValue(
      jsonResponse({
        steps: [],
        fees: {},
        details: {
          currencyIn: {
            currency: { address: params.fromToken, symbol: "USDC", decimals: 6, chainId: 1 },
            amount: "1000000",
          },
          currencyOut: {
            currency: { address: params.toToken, symbol: "USDG", decimals: 6, chainId: 4663 },
            amount: "989000",
          },
        },
      }),
    );
    const { relayAdapter } = await import("./relay.server");
    const result = await relayAdapter.getQuote(params);
    expect(result?.platformFeeAmount).toBe("0");
  });

  it("returns null instead of a fabricated zero-decimal token when the response has no currency details", async () => {
    setConfigured();
    fetchMock.mockResolvedValue(jsonResponse({ steps: [], fees: {} }));
    const { relayAdapter } = await import("./relay.server");
    const result = await relayAdapter.getQuote(params);
    expect(result).toBeNull();
  });
});
