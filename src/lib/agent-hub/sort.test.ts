import { describe, expect, it } from "vitest";
import { genesisAgentRegistry } from "@/config/genesisAgents";
import { sortGenesisAgents } from "./sort";

describe("sortGenesisAgents", () => {
  it("sorts by price ascending", () => {
    const sorted = sortGenesisAgents(genesisAgentRegistry, "price", "asc");
    const prices = sorted.map((a) => Number(a.price));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(sorted[0].name).toBe("Shrimp Scout");
  });

  it("sorts by price descending", () => {
    const sorted = sortGenesisAgents(genesisAgentRegistry, "price", "desc");
    expect(sorted[0].name).toBe("Titan Whale");
  });

  it("sorts by rarity from Common to Mythic ascending", () => {
    const sorted = sortGenesisAgents(genesisAgentRegistry, "rarity", "asc");
    expect(sorted[0].rarity).toBe("Common");
    expect(sorted.at(-1)?.rarity).toBe("Mythic");
  });

  it("sorts by farming rate", () => {
    const sorted = sortGenesisAgents(genesisAgentRegistry, "farming-rate", "asc");
    const rates = sorted.map((a) => Number(a.pulsePerDay));
    expect(rates).toEqual([...rates].sort((a, b) => a - b));
  });

  it("sorts by max supply", () => {
    const sorted = sortGenesisAgents(genesisAgentRegistry, "supply", "desc");
    expect(sorted[0].name).toBe("Shrimp Scout"); // largest max supply (2500)
  });

  it("does not mutate the original array", () => {
    const original = [...genesisAgentRegistry];
    sortGenesisAgents(genesisAgentRegistry, "price", "desc");
    expect(genesisAgentRegistry).toEqual(original);
  });
});
