import { describe, expect, it } from "vitest";
import {
  BUYBACK_FLOW_INPUTS,
  BUYBACK_FLOW_STAGES,
  GENESIS_AGENTS,
  SUPPLY_BADGES,
  TOKEN_ALLOCATION,
  TRUST_BADGES,
  WHY_ORCA_ITEMS,
} from "./tokenomics";

describe("tokenomics config", () => {
  it("has exactly six Genesis Agent Farming agents", () => {
    expect(GENESIS_AGENTS).toHaveLength(6);
  });

  it("has exactly four supply badges", () => {
    expect(SUPPLY_BADGES).toHaveLength(4);
  });

  it("has exactly eight token allocation items summing to 100%", () => {
    expect(TOKEN_ALLOCATION).toHaveLength(8);
    const total = TOKEN_ALLOCATION.reduce((sum, item) => sum + item.percent, 0);
    expect(total).toBe(100);
  });

  it("has exactly six Why ORCA utility items", () => {
    expect(WHY_ORCA_ITEMS).toHaveLength(6);
  });

  it("has a two-input, three-stage buyback flow", () => {
    expect(BUYBACK_FLOW_INPUTS).toHaveLength(2);
    expect(BUYBACK_FLOW_STAGES).toHaveLength(3);
  });

  it("has exactly four trust badges", () => {
    expect(TRUST_BADGES).toHaveLength(4);
  });
});
