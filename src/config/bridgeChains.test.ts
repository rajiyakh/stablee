import { describe, expect, it } from "vitest";
import {
  BRIDGE_CHAIN_IDS,
  bridgeChainFacts,
  bridgeWalletChains,
  isBridgeEnabled,
} from "./bridgeChains";

describe("bridgeChains", () => {
  it("returns null from bridgeWalletChains when VITE_BRIDGE_ENABLED is unset (no-regression guarantee)", () => {
    expect(isBridgeEnabled()).toBe(false);
    expect(bridgeWalletChains()).toBeNull();
  });

  it("never lists a chain id more than once", () => {
    const facts = bridgeChainFacts();
    const ids = facts.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("never duplicates Robinhood Chain — appears at most once regardless of whether env vars are configured", () => {
    // Whether or not this environment has VITE_ROBINHOOD_* configured, the
    // dedupe logic must mean Robinhood's chain id (if present at all) shows
    // up exactly once, never twice from a local re-definition colliding
    // with robinhoodChain.ts's own value.
    const ids = bridgeChainFacts().map((c) => c.id);
    const robinhoodCount = ids.filter((id) => id === 4663).length;
    expect(robinhoodCount).toBeLessThanOrEqual(1);
  });

  it("BRIDGE_CHAIN_IDS has no duplicates", () => {
    expect(new Set(BRIDGE_CHAIN_IDS).size).toBe(BRIDGE_CHAIN_IDS.length);
  });
});
