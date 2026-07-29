import { describe, expect, it } from "vitest";
import { unconfiguredClaimAdapter } from "./unconfiguredClaimAdapter";

describe("unconfiguredClaimAdapter", () => {
  it("reports claim as not live and not configured pre-integration", async () => {
    const status = await unconfiguredClaimAdapter.getClaimStatus("0xabc");
    expect(status.configured).toBe(false);
    expect(status.claimLive).toBe(false);
  });

  it("always returns a claimable amount of 0, never a fabricated balance", async () => {
    const amount = await unconfiguredClaimAdapter.getClaimableAmount("0xabc");
    expect(amount).toBe("0");
  });

  it("never prepares a successful claim while contracts are not configured", async () => {
    const prepared = await unconfiguredClaimAdapter.prepareClaim("0xabc");
    expect(prepared.configured).toBe(false);
  });
});
