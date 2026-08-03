import { describe, expect, it } from "vitest";
import { GENESIS_AGENTS } from "./tokenomics";

describe("tokenomics config", () => {
  it("has exactly six Genesis Agent Farming agents", () => {
    expect(GENESIS_AGENTS).toHaveLength(6);
  });
});
