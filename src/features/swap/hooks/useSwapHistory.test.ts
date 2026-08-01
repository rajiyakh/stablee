import { describe, expect, it } from "vitest";
import { capHistory, storageKey, type SwapHistoryEntry } from "./useSwapHistory";

function makeEntry(hash: string): SwapHistoryEntry {
  return {
    hash,
    timestamp: "2026-08-01T00:00:00.000Z",
    sellSymbol: "WETH",
    sellAmount: "1",
    buySymbol: "USDG",
    buyAmount: "1800",
    status: "confirmed",
  };
}

describe("storageKey", () => {
  it("lowercases the address so casing differences share one key", () => {
    expect(storageKey("0xABCDEF1234567890abcdef1234567890ABCDEF12")).toBe(
      "robinpulse_swap_history_v1_0xabcdef1234567890abcdef1234567890abcdef12",
    );
  });

  it("scopes different addresses to different keys", () => {
    expect(storageKey("0x1111111111111111111111111111111111111111")).not.toBe(
      storageKey("0x2222222222222222222222222222222222222222"),
    );
  });
});

describe("capHistory", () => {
  it("prepends the new entry so it's newest-first", () => {
    const existing = [makeEntry("0xold")];
    const result = capHistory(existing, makeEntry("0xnew"));
    expect(result[0].hash).toBe("0xnew");
    expect(result[1].hash).toBe("0xold");
  });

  it("caps the list at the given max, dropping the oldest", () => {
    const existing = [makeEntry("a"), makeEntry("b"), makeEntry("c")];
    const result = capHistory(existing, makeEntry("new"), 3);
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.hash)).toEqual(["new", "a", "b"]);
  });

  it("does not mutate the original array", () => {
    const existing = [makeEntry("a")];
    capHistory(existing, makeEntry("new"));
    expect(existing).toHaveLength(1);
  });
});
