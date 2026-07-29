/**
 * Agent Hub shared types — ownership positions, mint/claim status, and the
 * three contract-ready adapter interfaces. None of these are backed by a
 * real integration yet; see src/lib/agent-hub/unconfigured*.ts for the
 * "not configured" stub implementations, and docs/AGENT_CONTRACT_INTEGRATION.md.
 */

export type OwnedAgentPositionStatus =
  "preview" | "pending-activation" | "farming" | "paused" | "claimable" | "claimed";

export interface OwnedAgentPosition {
  ownershipId: string;
  agentId: string;
  tokenId?: string;

  ownerAddress?: string;

  acquiredAt: string;
  activatedAt: string;

  lastClaimedAt?: string;
  claimedPulse: string;

  status: OwnedAgentPositionStatus;
}

export interface AgentMintStatus {
  configured: boolean;
  mode: "preview" | "allowlist" | "public" | "paused" | "sold-out";
  message: string;
}

export interface AgentSupplyStatus {
  agentId: string;
  maxSupply: number;
  /** Only present once a real contract is connected — never a guessed/fallback number. */
  minted: number | null;
}

export interface RecruitmentRequest {
  agentId: string;
  quantity: number;
  walletAddress?: string;
}

export interface PreparedRecruitment {
  configured: boolean;
  message: string;
}

export interface PulseClaimStatus {
  configured: boolean;
  claimLive: boolean;
  message: string;
}

export interface PreparedClaim {
  configured: boolean;
  message: string;
}

/** Prepares/executes an Agent recruitment (mint). Never simulates a successful transaction while unconfigured. */
export interface AgentMintAdapter {
  getMintStatus(): Promise<AgentMintStatus>;
  getAgentSupply(agentId: string): Promise<AgentSupplyStatus>;
  getWalletMintedCount(wallet: string, agentId: string): Promise<number>;
  prepareRecruitment(request: RecruitmentRequest): Promise<PreparedRecruitment>;
}

/** Reads which Genesis Agents a wallet owns. Always returns empty ownership pre-integration. */
export interface AgentOwnershipAdapter {
  getOwnedAgents(wallet: string): Promise<OwnedAgentPosition[]>;
}

/** Reads/prepares a $PULSE claim. Never returns a claimable amount or a successful claim while unconfigured. */
export interface PulseClaimAdapter {
  getClaimStatus(wallet: string): Promise<PulseClaimStatus>;
  getClaimableAmount(wallet: string): Promise<string>;
  prepareClaim(wallet: string): Promise<PreparedClaim>;
}
