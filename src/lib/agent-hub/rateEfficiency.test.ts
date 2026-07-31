import { describe, expect, it } from "vitest";
import { getGenesisAgent } from "@/config/genesisAgents";
import { calculatePulsePerEth, getRateTierLabel } from "./rateEfficiency";

describe("calculatePulsePerEth", () => {
  it("computes $ORCA per ETH for each agent from real config values", () => {
    expect(calculatePulsePerEth(getGenesisAgent("shrimp-scout")!)).toBe(5000);
    expect(calculatePulsePerEth(getGenesisAgent("manta-signal")!)).toBe(6000);
    expect(calculatePulsePerEth(getGenesisAgent("dolphin-echo")!)).toBe(9000);
    expect(calculatePulsePerEth(getGenesisAgent("razor-shark")!)).toBe(10000);
    expect(calculatePulsePerEth(getGenesisAgent("blackfin-orca")!)).toBe(10500);
    expect(calculatePulsePerEth(getGenesisAgent("titan-whale")!)).toBe(16000);
  });
});

describe("getRateTierLabel", () => {
  it("labels the lowest-efficiency agent as the base rate", () => {
    expect(getRateTierLabel(getGenesisAgent("shrimp-scout")!)).toBe("BASE RATE");
  });

  it("labels mid-tier agents with their percent above base", () => {
    expect(getRateTierLabel(getGenesisAgent("manta-signal")!)).toBe("+20% RATE");
    expect(getRateTierLabel(getGenesisAgent("dolphin-echo")!)).toBe("+80% RATE");
    expect(getRateTierLabel(getGenesisAgent("razor-shark")!)).toBe("+100% RATE");
    expect(getRateTierLabel(getGenesisAgent("blackfin-orca")!)).toBe("+110% RATE");
  });

  it("gives the highest-efficiency agent the best-rate treatment", () => {
    expect(getRateTierLabel(getGenesisAgent("titan-whale")!)).toBe("★ +220% RATE · BEST RATE");
  });
});
