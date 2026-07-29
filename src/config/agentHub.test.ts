import { afterEach, describe, expect, it, vi } from "vitest";
import { agentHubConfig, isAgentHubPreviewEnabled } from "./agentHub";

describe("agentHubConfig", () => {
  it("defaults to preview mode", () => {
    expect(agentHubConfig.mode).toBe("preview");
  });

  it("ships with marketplace, fusion and transfers all disabled", () => {
    expect(agentHubConfig.marketplaceEnabled).toBe(false);
    expect(agentHubConfig.fusionEnabled).toBe(false);
    expect(agentHubConfig.transfersEnabled).toBe(false);
  });

  it("ships with the complete-set bonus disabled and a bonusPercent of 0", () => {
    expect(agentHubConfig.completeSetBonus.enabled).toBe(false);
    expect(agentHubConfig.completeSetBonus.bonusPercent).toBe(0);
    expect(agentHubConfig.completeSetBonus.requiredAgentIds).toEqual([
      "vector",
      "echo",
      "ledger",
      "atlas",
      "nova",
      "oracle",
    ]);
  });
});

describe("isAgentHubPreviewEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is false when the env flag is unset, even in dev", () => {
    vi.stubEnv("VITE_ENABLE_AGENT_HUB_PREVIEW", "");
    expect(isAgentHubPreviewEnabled()).toBe(false);
  });

  it("is false when DEV is false, even if the env flag is 'true' (production must hide the dev control)", () => {
    vi.stubEnv("VITE_ENABLE_AGENT_HUB_PREVIEW", "true");
    vi.stubEnv("DEV", false);
    expect(isAgentHubPreviewEnabled()).toBe(false);
  });

  it("is true only when both DEV is true and the env flag is 'true'", () => {
    vi.stubEnv("VITE_ENABLE_AGENT_HUB_PREVIEW", "true");
    vi.stubEnv("DEV", true);
    expect(isAgentHubPreviewEnabled()).toBe(true);
  });
});
