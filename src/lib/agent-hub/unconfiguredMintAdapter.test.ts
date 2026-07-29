import { describe, expect, it } from "vitest";
import { unconfiguredMintAdapter } from "./unconfiguredMintAdapter";

describe("unconfiguredMintAdapter", () => {
  it("reports mint status as not configured pre-integration", async () => {
    const status = await unconfiguredMintAdapter.getMintStatus();
    expect(status.configured).toBe(false);
    expect(status.message).toBe("Not configured");
  });

  it("returns the real configured maxSupply, but null minted count (never a fabricated number)", async () => {
    const supply = await unconfiguredMintAdapter.getAgentSupply("vector");
    expect(supply.maxSupply).toBe(2500);
    expect(supply.minted).toBeNull();
  });

  it("returns maxSupply 0 for an unknown agent id rather than throwing", async () => {
    const supply = await unconfiguredMintAdapter.getAgentSupply("not-a-real-agent");
    expect(supply.maxSupply).toBe(0);
    expect(supply.minted).toBeNull();
  });

  it("reports zero minted count for any wallet pre-integration", async () => {
    const count = await unconfiguredMintAdapter.getWalletMintedCount("0xabc", "vector");
    expect(count).toBe(0);
  });

  it("never prepares a successful recruitment while contracts are not configured", async () => {
    const prepared = await unconfiguredMintAdapter.prepareRecruitment({
      agentId: "oracle",
      quantity: 1,
    });
    expect(prepared.configured).toBe(false);
    expect(prepared.message).toBe("Not configured");
  });
});
