import { describe, expect, it } from "vitest";
import { projectConfig } from "./project";
import {
  agentHubChainId,
  contractConfig,
  isAgentHubContractsConfigured,
  isPulseClaimConfigured,
} from "./contracts";

describe("contracts config", () => {
  it("ships with every contract address empty — never a sample/placeholder address", () => {
    expect(contractConfig.agentCollection).toBe("");
    expect(contractConfig.agentFarming).toBe("");
    expect(contractConfig.pulseToken).toBe("");
    expect(contractConfig.pulseClaim).toBe("");
    expect(contractConfig.treasury).toBe("");
  });

  it("reports contracts as not configured when addresses are missing", () => {
    expect(isAgentHubContractsConfigured()).toBe(false);
  });

  it("reports the claim contract as not configured when missing", () => {
    expect(isPulseClaimConfigured()).toBe(false);
  });

  it("resolves chainId from the shared wallet config, not an independent value", () => {
    // Whatever projectConfig.wallet.chainId happens to be in this
    // environment, agentHubChainId() must always match it exactly — proving
    // there is a single source of truth rather than two chain ids that
    // could silently disagree.
    expect(agentHubChainId()).toBe(projectConfig.wallet.chainId);
  });
});
