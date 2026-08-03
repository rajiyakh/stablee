import { describe, expect, it } from "vitest";
import { getDefaultBridgeTokens } from "./BridgeTokenSelect";
import { BRIDGE_NATIVE_SENTINEL } from "@/lib/bridge/types";
import type { SupportedToken } from "@/lib/bridge/types";

function token(overrides: Partial<SupportedToken>): SupportedToken {
  return {
    chainId: 1,
    address: "0x0000000000000000000000000000000000dEaD",
    symbol: "TOK",
    name: "Token",
    decimals: 18,
    logoUrl: null,
    priceUsd: null,
    ...overrides,
  };
}

describe("getDefaultBridgeTokens", () => {
  it("includes the native sentinel and known symbols, excludes obscure ones", () => {
    const tokens = [
      token({ address: BRIDGE_NATIVE_SENTINEL, symbol: "ETH" }),
      token({ address: "0x1", symbol: "WETH" }),
      token({ address: "0x2", symbol: "USDT" }),
      token({ address: "0x3", symbol: "USDC" }),
      token({ address: "0x4", symbol: "AMONG" }),
      token({ address: "0x5", symbol: "HUH" }),
    ];

    const result = getDefaultBridgeTokens(tokens);

    expect(result.map((t) => t.symbol)).toEqual(["ETH", "WETH", "USDT", "USDC"]);
  });

  it("matches known symbols case-insensitively", () => {
    const tokens = [
      token({ address: BRIDGE_NATIVE_SENTINEL, symbol: "ETH" }),
      token({ address: "0x1", symbol: "usdc" }),
    ];

    const result = getDefaultBridgeTokens(tokens);

    expect(result.map((t) => t.symbol)).toEqual(["ETH", "usdc"]);
  });

  it("falls back to the full list when curated matches are too few", () => {
    const tokens = [
      token({ address: BRIDGE_NATIVE_SENTINEL, symbol: "ETH" }),
      token({ address: "0x1", symbol: "AMONG" }),
      token({ address: "0x2", symbol: "HUH" }),
    ];

    const result = getDefaultBridgeTokens(tokens);

    expect(result).toEqual(tokens);
  });

  it("returns the full (empty) list when no tokens exist at all", () => {
    expect(getDefaultBridgeTokens([])).toEqual([]);
  });
});
