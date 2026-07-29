import {
  CONTRACTS_NOT_CONFIGURED_MESSAGE,
  isAgentHubContractsConfigured,
} from "@/config/contracts";
import { agentHubConfig } from "@/config/agentHub";
import { getGenesisAgent } from "@/config/genesisAgents";
import type {
  AgentMintAdapter,
  AgentMintStatus,
  AgentSupplyStatus,
  PreparedRecruitment,
  RecruitmentRequest,
} from "./types";

export function agentMintConfigured(): boolean {
  return isAgentHubContractsConfigured();
}

/**
 * Not-configured stub for AgentMintAdapter. Always resolves — never throws
 * on a read, never returns a fake success on a write — so the UI can render
 * a deterministic "not configured" state instead of an error boundary.
 */
export const unconfiguredMintAdapter: AgentMintAdapter = {
  async getMintStatus(): Promise<AgentMintStatus> {
    return {
      configured: agentMintConfigured(),
      mode: agentHubConfig.mode,
      message: agentMintConfigured() ? "Configured" : CONTRACTS_NOT_CONFIGURED_MESSAGE,
    };
  },

  async getAgentSupply(agentId: string): Promise<AgentSupplyStatus> {
    // Maximum supply is real, owner-configured data and always safe to
    // show; only the live "minted" count requires a real contract read.
    const agent = getGenesisAgent(agentId);
    return {
      agentId,
      maxSupply: agent?.maxSupply ?? 0,
      minted: null,
    };
  },

  async getWalletMintedCount(): Promise<number> {
    return 0;
  },

  async prepareRecruitment(_request: RecruitmentRequest): Promise<PreparedRecruitment> {
    return {
      configured: false,
      message: CONTRACTS_NOT_CONFIGURED_MESSAGE,
    };
  },
};
