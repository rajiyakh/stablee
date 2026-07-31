import { describe, expect, it } from "vitest";
import { getGenesisAgent } from "@/config/genesisAgents";
import { calculatePulsePerEth, getRateBarFill, getRateTierLabel } from "./rateEfficiency";

describe("calculatePulsePerEth", () => {
  it("computes $PULSE per ETH for each agent from real config values", () => {
    expect(calculatePulsePerEth(getGenesisAgent("vector")!)).toBe(5000);
    expect(calculatePulsePerEth(getGenesisAgent("echo")!)).toBe(6000);
    expect(calculatePulsePerEth(getGenesisAgent("ledger")!)).toBe(9000);
    expect(calculatePulsePerEth(getGenesisAgent("atlas")!)).toBe(10000);
    expect(calculatePulsePerEth(getGenesisAgent("nova")!)).toBe(10500);
    expect(calculatePulsePerEth(getGenesisAgent("oracle")!)).toBe(16000);
  });
});

describe("getRateTierLabel", () => {
  it("labels the lowest-efficiency agent as the base rate", () => {
    expect(getRateTierLabel(getGenesisAgent("vector")!)).toBe("BASE RATE");
  });

  it("labels mid-tier agents with their percent above base", () => {
    expect(getRateTierLabel(getGenesisAgent("echo")!)).toBe("+20% RATE");
    expect(getRateTierLabel(getGenesisAgent("ledger")!)).toBe("+80% RATE");
    expect(getRateTierLabel(getGenesisAgent("atlas")!)).toBe("+100% RATE");
    expect(getRateTierLabel(getGenesisAgent("nova")!)).toBe("+110% RATE");
  });

  it("gives the highest-efficiency agent the best-rate treatment", () => {
    expect(getRateTierLabel(getGenesisAgent("oracle")!)).toBe("★ +220% RATE · BEST RATE");
  });
});

describe("getRateBarFill", () => {
  it("floors the lowest tier's bar at 0.6 rather than showing it empty", () => {
    expect(getRateBarFill(getGenesisAgent("vector")!)).toBe(0.6);
  });

  it("fills the highest tier's bar completely", () => {
    expect(getRateBarFill(getGenesisAgent("oracle")!)).toBe(1);
  });

  it("scales mid-tier agents monotonically between the floor and full", () => {
    const echo = getRateBarFill(getGenesisAgent("echo")!);
    const ledger = getRateBarFill(getGenesisAgent("ledger")!);
    const atlas = getRateBarFill(getGenesisAgent("atlas")!);
    const nova = getRateBarFill(getGenesisAgent("nova")!);

    expect(echo).toBeCloseTo(0.6364, 3);
    expect(ledger).toBeCloseTo(0.7455, 3);
    expect(atlas).toBeCloseTo(0.7818, 3);
    expect(nova).toBeCloseTo(0.8, 3);
    expect(echo).toBeLessThan(ledger);
    expect(ledger).toBeLessThan(atlas);
    expect(atlas).toBeLessThan(nova);
  });
});
