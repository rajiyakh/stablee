import { describe, expect, it } from "vitest";
import { resolveCustomToken } from "./discoverTokens.server";

/**
 * Live tests against the real Robinhood Chain RPC — matches this app's
 * standing discipline of verifying on-chain behavior empirically rather
 * than mocking it away. AMD is a real, confirmed ERC-20 on Robinhood Chain
 * (see chainlinkFeeds.ts) that is deliberately NOT in swapTokens.ts's
 * curated list (0x rejects it for trading), making it a real address this
 * resolver has never seen before — exactly the scenario a pasted address
 * exercises.
 */
describe("resolveCustomToken (live RPC)", () => {
  it("resolves a real ERC-20 contract's decimals/symbol/name on-chain", async () => {
    const token = await resolveCustomToken("0x86923f96303D656E4aa86D9d42D1e57ad2023fdC");
    expect(token).not.toBeNull();
    expect(token?.symbol).toBe("AMD");
    expect(token?.decimals).toBe(18);
    expect(token?.verified).toBe(false);
    expect(token?.source).toBe("custom");
  }, 20_000);

  it("returns null for an address with no ERC-20 contract (never fabricates)", async () => {
    const token = await resolveCustomToken("0x000000000000000000000000000000000000dEaD");
    expect(token).toBeNull();
  }, 20_000);

  it("returns null for a malformed address without hitting the network", async () => {
    const token = await resolveCustomToken("not-an-address");
    expect(token).toBeNull();
  });
});
