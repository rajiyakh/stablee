/**
 * Agent Hub contract configuration.
 *
 * Every address is intentionally EMPTY until the owner supplies a real,
 * deployed contract address. Never invent, guess, or fall back to a sample
 * address — functionality stays disabled and the UI shows "Not configured"
 * until every required field is present. See docs/AGENT_CONTRACT_INTEGRATION.md.
 *
 * chainId is deliberately NOT read from its own env var — Agent Hub deploys
 * to the same Robinhood Mainnet chain the rest of the app already targets,
 * so this reuses projectConfig.wallet.chainId as the single source of truth
 * instead of asking the owner to fill in the same chain facts twice.
 */

import { projectConfig } from "./project";

const env = import.meta.env as Record<string, string | undefined>;
const read = (key: string): string => (env[key] ?? "").trim();

export const contractConfig = {
  chainId: null as number | null,

  agentCollection: read("VITE_AGENT_COLLECTION_CONTRACT"),
  agentFarming: read("VITE_AGENT_FARMING_CONTRACT"),
  pulseToken: read("VITE_PULSE_TOKEN_CONTRACT"),
  pulseClaim: read("VITE_PULSE_CLAIM_CONTRACT"),

  // Not wired to an env var yet — needs an explicit owner-designated Agent
  // Hub treasury address, distinct from the swap-fee treasury
  // (ROBINPULSE_FEE_RECIPIENT). Left empty until that decision is made.
  treasury: "",
} as const;

export type ContractConfig = typeof contractConfig;

export const CONTRACTS_NOT_CONFIGURED_MESSAGE = "Not configured";

/** Resolves Agent Hub's chain from the single shared wallet chain config — never a second, independently-set chain id. */
export function agentHubChainId(): number | null {
  return projectConfig.wallet.chainId;
}

export function isAgentHubContractsConfigured(): boolean {
  return Boolean(
    agentHubChainId() !== null &&
    contractConfig.agentCollection &&
    contractConfig.agentFarming &&
    contractConfig.pulseToken,
  );
}

export function isPulseClaimConfigured(): boolean {
  return Boolean(agentHubChainId() !== null && contractConfig.pulseClaim);
}
