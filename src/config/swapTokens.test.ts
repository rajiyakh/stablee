import { describe, expect, it } from "vitest";
import { NATIVE_SELL_ENABLED, NATIVE_SENTINEL, findSwapToken, swapTokens } from "./swapTokens";

describe("swapTokens native ETH entry", () => {
  it("includes the native sentinel exactly when NATIVE_SELL_ENABLED is true", () => {
    const hasNative = swapTokens.some(
      (t) => t.address.toLowerCase() === NATIVE_SENTINEL.toLowerCase(),
    );
    expect(hasNative).toBe(NATIVE_SELL_ENABLED);
  });

  it("resolves the native sentinel via findSwapToken", () => {
    if (!NATIVE_SELL_ENABLED) return;
    const token = findSwapToken(NATIVE_SENTINEL);
    expect(token?.symbol).toBe("ETH");
    expect(token?.decimals).toBe(18);
    expect(token?.verified).toBe(true);
  });

  it("never duplicates the curated WETH/USDG entries", () => {
    const addresses = swapTokens.map((t) => t.address.toLowerCase());
    expect(new Set(addresses).size).toBe(addresses.length);
  });
});
