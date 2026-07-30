import { describe, expect, it } from "vitest";
import { genesisAgentRegistry, getGenesisAgent, enabledGenesisAgents } from "./genesisAgents";

describe("genesisAgentRegistry", () => {
  it("has exactly six Genesis Agents", () => {
    expect(genesisAgentRegistry).toHaveLength(6);
  });

  it("has unique ids and slugs across all six agents", () => {
    const ids = genesisAgentRegistry.map((a) => a.id);
    const slugs = genesisAgentRegistry.map((a) => a.slug);
    expect(new Set(ids).size).toBe(6);
    expect(new Set(slugs).size).toBe(6);
  });

  it("includes the six required identities", () => {
    const names = genesisAgentRegistry.map((a) => a.name).sort();
    expect(names).toEqual(["Atlas", "Echo", "Ledger", "Nova", "Oracle", "Vector"].sort());
  });

  it("every agent has a non-empty price and positive supply and daily farming rate", () => {
    for (const agent of genesisAgentRegistry) {
      expect(Number(agent.price)).toBeGreaterThan(0);
      expect(agent.maxSupply).toBeGreaterThan(0);
      expect(Number(agent.pulsePerDay)).toBeGreaterThan(0);
      expect(agent.avatarPath).toMatch(/^\/agents\/.+\.webp$/);
    }
  });

  it("higher rarity tiers farm at a higher daily rate (economics stay internally consistent)", () => {
    const bySupply = [...genesisAgentRegistry].sort((a, b) => b.maxSupply - a.maxSupply);
    for (let i = 1; i < bySupply.length; i++) {
      expect(Number(bySupply[i].pulsePerDay)).toBeGreaterThanOrEqual(
        Number(bySupply[i - 1].pulsePerDay),
      );
    }
  });
});

describe("getGenesisAgent", () => {
  it("finds an agent by slug", () => {
    expect(getGenesisAgent("vector")?.name).toBe("Vector");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getGenesisAgent("does-not-exist")).toBeUndefined();
  });
});

describe("enabledGenesisAgents", () => {
  it("returns only agents with enabled: true", () => {
    const enabled = enabledGenesisAgents();
    expect(enabled.every((a) => a.enabled)).toBe(true);
    expect(enabled.length).toBeGreaterThan(0);
  });
});
