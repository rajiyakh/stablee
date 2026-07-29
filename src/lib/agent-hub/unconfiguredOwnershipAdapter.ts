import { isAgentHubContractsConfigured } from "@/config/contracts";
import type { AgentOwnershipAdapter, OwnedAgentPosition } from "./types";

/**
 * Not-configured stub for AgentOwnershipAdapter. Always returns empty
 * ownership pre-integration — real on-chain positions are never fabricated.
 * Local preview/demo positions are a deliberately SEPARATE store
 * (src/lib/agent-hub/localPreview.ts) and never flow through this adapter.
 */
export const unconfiguredOwnershipAdapter: AgentOwnershipAdapter = {
  async getOwnedAgents(_wallet: string): Promise<OwnedAgentPosition[]> {
    if (!isAgentHubContractsConfigured()) return [];
    // Real contract read would happen here once agentCollection/agentFarming
    // are configured — still returns empty until that integration exists.
    return [];
  },
};
