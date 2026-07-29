import { describe, expect, it } from "vitest";
import { deriveClaimButtonState } from "./deriveClaimButtonState";

const base = {
  isWalletConnected: true,
  isWrongNetwork: false,
  pendingAmount: "10",
  isClaiming: false,
  justClaimed: false,
};

describe("deriveClaimButtonState", () => {
  it("is TGE Not Live before TGE, regardless of other inputs (current shipped config)", () => {
    expect(deriveClaimButtonState(base)).toBe("tge-not-live");
  });

  it("shows claimed once justClaimed is true, overriding every other check", () => {
    expect(deriveClaimButtonState({ ...base, justClaimed: true })).toBe("claimed");
  });

  it("shows claiming while an in-flight claim is happening", () => {
    expect(deriveClaimButtonState({ ...base, isClaiming: true })).toBe("claiming");
  });

  it("claiming takes priority over justClaimed being stale/false", () => {
    expect(deriveClaimButtonState({ ...base, isClaiming: true, justClaimed: false })).toBe(
      "claiming",
    );
  });
});
