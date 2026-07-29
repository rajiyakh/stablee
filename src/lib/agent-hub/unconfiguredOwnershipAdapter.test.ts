import { describe, expect, it } from "vitest";
import { unconfiguredOwnershipAdapter } from "./unconfiguredOwnershipAdapter";

describe("unconfiguredOwnershipAdapter", () => {
  it("always returns empty ownership pre-integration, never a fabricated position", async () => {
    const positions = await unconfiguredOwnershipAdapter.getOwnedAgents("0x1234567890");
    expect(positions).toEqual([]);
  });

  it("returns empty ownership for an empty wallet address too", async () => {
    const positions = await unconfiguredOwnershipAdapter.getOwnedAgents("");
    expect(positions).toEqual([]);
  });
});
